import Canvas from './canvas'
export const isCanvas = (target) => {
  return target instanceof Canvas
}
export const setTransform = (transform, target, val) => {
  const str = transform.replace(' ')
  if (str.indexOf(target) !== -1) {
    let exec = null
    const arr = []
    const regx = /[a-z]+\([^\)]+\)/gi
    while ((exec = regx.exec(str)) && exec[0]) {
      if (exec[0].indexOf(target) !== -1) {
        arr.push(`${target}(${val})`)
      } else {
        arr.push(exec[0])
      }
    }
    return arr.join(' ')
  } else {
    transform += ` ${target}(${val})`
    return transform
  }
}
export const UUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
export const getPosition = (path, lineWidth, scale) => {
  console.log(lineWidth)
  if (!path || !path.length) {
    return false
  }
  let minx = path[0].x * scale.x,
    maxx = path[0].x * scale.x,
    miny = path[0].y * scale.y,
    maxy = path[0].y * scale.y,
    ox = path[0].x,
    oy = path[0].y,
    omaxx = path[0].x,
    omaxy = path[0].y
  path.forEach((item) => {
    if (item.x * scale.x < minx) {
      minx = item.x * scale.x
      ox = item.x
    }
    if (item.x * scale.x > maxx) {
      maxx = item.x * scale.x
      omaxx = item.x
    }
    if (item.y * scale.y < miny) {
      miny = item.y * scale.y
      oy = item.y
    }
    if (item.y * scale.y > maxy) {
      maxy = item.y * scale.y
      omaxy = item.y
    }
  })
  return {
    minx,
    maxx,
    miny,
    maxy,
    ox,
    oy,
    omaxx,
    omaxy,
    width: (maxx - minx) > lineWidth ? maxx - minx : lineWidth,
    height: (maxy - miny) > lineWidth ? maxy - miny : lineWidth,
    ow: (omaxx - ox) > lineWidth ? omaxx - ox : lineWidth,
    oh: (omaxy - oy) > lineWidth ? omaxy - oy : lineWidth,
  }
}

export const isOnTheArea = (currPoint, targetArea) => {
  if (
    currPoint.x >= targetArea.x &&
    currPoint.x <= targetArea.x + targetArea.w &&
    currPoint.y >= targetArea.y &&
    currPoint.y <= targetArea.y + targetArea.h
  ) {
    return true
  } else {
    return false
  }
}
export const isOnThePath = (currPoint, draw) => {
  console.log(currPoint.x, currPoint.y, draw)
  for (let i = 0; i < draw.path.length; i++) {
    const curr = draw.path[i]
    if (currPoint.x >= curr.x * draw.xScale - draw.position.minx + draw.x - draw.lineWidth &&
      currPoint.x <= curr.x * draw.xScale - draw.position.minx + draw.x + draw.lineWidth &&
      currPoint.y >= curr.y * draw.yScale - draw.position.miny + draw.y - draw.lineWidth &&
      currPoint.y <= curr.y * draw.yScale - draw.position.miny + draw.y + draw.lineWidth
    ) {
      return true
    }
  }
  return false
}
export const SIN = (deg) => {
  return Math.sin(deg * Math.PI / 180)
}
export const COS = (deg) => {
  return Math.cos(deg * Math.PI / 180)
}