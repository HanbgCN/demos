const Koa = require('koa')
const router = require('koa-router')()
const app = new Koa()
const Top250Model = require('./models/top250')
const cors = require('koa2-cors')
const bodyParser = require('koa-bodyParser')
const koaBody = require('koa-body')
const static = require('koa-static')
const fs = require('fs')
const path = require('path')
app.use(static(`${process.cwd()}/static`))
app.use(koaBody({
  // 支持文件格式
  multipart: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024,
    // 保留文件扩展名
    keepExtensions: true
  }
}))
// router.get('/top250', async ctx => {
//   const data = await Top250Model.find()
//   ctx.body = {
//     code: 200,
//     res: data,
//     msg: 'GET /top250 success'    
//   }
// })
// router.get('/top250', async ctx => {
//   const { start = 0, limit = 5 } = ctx.query
//   const data = await Top250Model.find().skip(Number(start)).limit(Number(limit))
//   const total = await Top250Model.find().count()
//   ctx.body = {
//     code: 200,
//     res: data,
//     total,
//     msg: 'GET /top250 success'
//   }
// })
router.get('/top250', async ctx => {
  const { page = 1, size = 5 } = ctx.query
  const data = await Top250Model.find().skip(Number((page - 1) * size)).limit(Number(size))
  const total = await Top250Model.find().count()
  ctx.body = {
    code: 200,
    res: data,
    total,
    msg: 'GET /top250 success'
  }
})
router.post('/collect', async ctx => {
  const id = ctx.request.body.id
  const res = await Top250Model.updateOne({ _id: id }, { collected: true })
  if (res.modifiedCount) {
    ctx.body = {
      code: 200,
      msg: '收藏成功'
    }
  } else {
    ctx.body = {
      code: 400,
      msg: '已经收藏'
    }
  }
})
router.post('/collect/cancel', async ctx => {
  const id = ctx.request.body.id
  const res = await Top250Model.updateOne({ _id: id}, { collected: false})
  if (res.modifiedCount) {
    ctx.body = {
      code: 200,
      msg: '取消收藏成功'
    }
  } else {
    ctx.body = {
      code: 400,
      msg: '已经取消收藏'
    }
  }
})
router.post('/delete', async ctx => {
  const id = ctx.request.body.id
  const res = await Top250Model.deleteOne({ _id: id })
  if (res.deletedCount) {
    ctx.body = {
      code: 200,
      msg: '删除成功'
    }
  } else {
    ctx.body = {
      code: 200,
      msg: '删除失败'
    }
  }
  // res: { acknowledged: true, deletedCount: 1 }
})
router.get('/detail', async ctx => {
  const { id } = ctx.request.query
  const data = await Top250Model.find({ _id: id })
  ctx.body = {
    code: 200,
    res: data[0],
    msg: 'sucess'
  }
})

router.post('/doAdd', async ctx => {
  const { title, slogo, evaluate, rating, labels, collected } = ctx.request.body
  const file = ctx.request.files.file
  const basename = path.basename(file.filepath)
  // basename === file.newFilename
  // 将本地图片存到服务器
  const reader = fs.createReadStream(file.filepath)
  let filePath = process.cwd() + `/static/${basename}`
  // 创建可写流
  const upStream = fs.createWriteStream(filePath)
  // 可读流通过管道写入可写流
  reader.pipe(upStream)

  // 将服务器上的图片地址存入数据库
  const pic = `${ctx.origin}/${basename}`
  const data = new Top250Model({
    title,
    pic,
    slogo,
    evaluate,
    rating,
    labels,
    collected: Boolean(collected)
  })
  data.save(err => {
    if (err) {
      throw err
    }
    ctx.body = {
      code: 200,
      msg: '保存成功'
    }
  })
})
app.use(bodyParser())
app.use(cors())
app.use(router.routes())
app.listen(8080, () => {
  console.info('localhost:8080启动成功')
})
