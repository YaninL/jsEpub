const ebook = {}
ebook.media = {}
ebook.section = {}
ebook.cover = {}
ebook.bookinfo = {}

const xmlBuilder = new fxparser.XMLBuilder(xmlOption)
const xmlParser = new fxparser.XMLParser(xmlOption)

window.onbeforeunload = ()=>{return ''}

window.onload = ()=>{
  const headTitle = document.querySelector('.page-header h1')
  headTitle.innerHTML = appname + ' ebook editor'
  ebook.media = {}
  ebook.section = {}
  ebook.cover = {}
  ebook.bookinfo = {}
  ebook.bookinfo = {filename: newbookName}
  const xhr = new XMLHttpRequest()
  xhr.open('GET', templatePath, true)
  xhr.responseType = 'arraybuffer'
  xhr.onload = ()=>{
    if (xhr.status === 200){
      openbook(xhr.response)
    }
  }
  xhr.send()
}

/* ส่วนเปิดไฟล์หนังสือ */
newbook.onclick = ()=>{
  dispatchEvent(new Event('load'))
}

openfile.onclick = (e)=>{
  $('#epubfile')[0].click()
}

epubfile.onchange = (file)=>{
  const filename = file.target.files[0].name 
  if(filenameExtension(filename) != 'epub'){
    alert('ไฟล์ที่เลือกไม่ใช่ไฟล์ epub')
    return
  }
  ebook.media = {}
  ebook.section = {}
  ebook.cover = {}
  ebook.bookinfo = {}
  ebook.bookinfo.filename = filename.slice(0, -5) 
  openbook(file.target.files[0])
}

const openbook = (data)=>{
  const zip = new JSZip()
  zip.loadAsync(data).then(async(zip)=>{
    const metainfxml = await zip.files['META-INF/container.xml'].async('text')
    setstatus('กำลังอ่านแฟ้ม packaging...', false)
    const metaObject = xmlParser.parse(metainfxml)
    const opffile = metaObject.container.rootfiles.rootfile['@full-path']
    const opfpath = pathDirectory(opffile)
    const opfxml = await zip.files[opffile].async('text')

    // อ่านข้อมูลหนังสือ
    setstatus('กำลังอ่านแฟ้ม metadata...', false)
    const opfObject = xmlParser.parse(opfxml)
    const metadataObject = opfObject.package.metadata
    const manifestObject = opfObject.package.manifest
    const spineObject = opfObject.package.spine
    const title = metadataObject['dc:title']
    const creator = metadataObject['dc:creator']
    ebook.bookinfo.title = (typeof title === 'object') ? title['#text'] : title
    ebook.bookinfo.creator = (typeof creator === 'object') ? creator['#text'] : creator
    ebook.bookinfo.description = metadataObject['dc:description']
    ebook.bookinfo.publisher = metadataObject['dc:publisher']
    ebook.bookinfo.identifier = metadataObject['dc:identifier']['#text']
    if(ebook.bookinfo.identifier.indexOf('urn:uuid:') == -1 // ตรวจสอบuuid
      || ebook.bookinfo.identifier.indexOf('urn:uuid:b16a9417') != -1){
      ebook.bookinfo.identifier = generateUUID()
    }

    // แสดงข้อมูลหนังสือ
    const info = ebook.bookinfo 
    document.title = appname + ' - ' + info.title
    Object.keys(info).forEach((key)=>{
      $('#' + key).text((info[key] == '' ? '-' : info[key]))
    })

    setstatus('กำลังอ่านรายการหนังสือ...', false)
    const tocid = spineObject['@toc']
    const tochref = findvalue(manifestObject.item, '@id', tocid, '@href')
    const tocxml = await zip.files[opfpath + tochref].async('text')
    const tocObject = xmlParser.parse(tocxml)
    const toclist = {}
    const navpoint = tocObject.ncx.navMap.navPoint
    const readnappoint = (navpoint, depth)=>{
      depth = depth || 1
      navpoint.forEach(async(node)=>{
        const src = filename(node.content['@src']).split('#')[0]
        if(toclist[src]){
          toclist[src].subsection = {}
          toclist[src].subsection.title = node.navLabel.text
          toclist[src].subsection.depth = depth
        }else{
          toclist[src] = {}
          toclist[src].title = node.navLabel.text
          toclist[src].depth = depth
        }
        if(node.navPoint){
          readnappoint(node.navPoint, depth + 1)
        }
      })
    }
    readnappoint(navpoint)
    const spine = spineObject.itemref
    ebook.section = []
    spine.forEach(async(node, idx)=>{
      const idref = node['@idref']
      const item = findvalue(manifestObject.item, '@id', idref, '@href')
      const toc = toclist[filename(item)] || ''
      section = {}
      section.id = padLeftfilename(idref)
      section.href = padLeftfilename(filename(decodeURI(item)))
      section.title = fromHtmlEntities(toc.title)
      section.depth = toc.depth || -1
      if(toc.subsection || false){
        section.subsection = toc.subsection
      }
      ebook.section.push(section)
    })

    setstatus('กำลังอ่านปกหนังสือ...', false)
    ebook.cover.imageid = findvalue(metadataObject.meta, '@name', 'cover', '@content') 
    ebook.cover.imagehref = findvalue(manifestObject.item, '@id', ebook.cover.imageid, '@href')
    const coverhtml = findvalue(opfObject.package.guide.reference, '@type', 'cover', '@href')
    ebook.cover.htmlid = findvalue(manifestObject.item, '@href', coverhtml, '@id')
    ebook.cover.htmlhref = filename(coverhtml)
    const content = await zip.files[opfpath + ebook.cover.imagehref] || false
    if(content == false){
      console.log('Cover file not found: ' + ebook.cover.imagehref)
      setstatus('ไม่พบไฟล์ปก ' + ebook.cover.imagehref)
      ebook.cover.imagehref = 'cover.jpg'
      // ถ้าไม่มีปกจะ error เพิ่มใหม่ก็ไม่ได้
    }else{
      content.async('arraybuffer').then((data)=>{
        const blob = new Blob([data])
        const img = new Image
        img.onload = (e)=>{
          ebook.cover.imagewidth = e.target.naturalWidth
          ebook.cover.imageheight = e.target.naturalHeight
        }
        img.src = URL.createObjectURL(blob)
        $('#cover').html(img)
      })
    }

    setstatus('กำลังอ่านแฟ้มมีเดีย...', false)
    const manifest = manifestObject.item
    manifest.forEach(async(node, idx)=>{
      const mediatype = node['@media-type']
      const href = decodeURI(node['@href'])
      const id = node['@id']
      if(id == tocid) return
      const type = (mediatype == 'text/css' || mediatype == 'application/xhtml+xml'
        || mediatype == 'text/plain') ? 'text' : 'arraybuffer'
      const content = await zip.files[opfpath + href] || false
      if(content == false){
        console.log('File not found: ' + opfpath + href)
        setstatus('ไม่พบไฟล์ ' + href)
        return
      }
      content.async(type).then((data)=>{
        ebook.media[padLeftfilename(id)] = {}
        ebook.media[padLeftfilename(id)].href = padLeftfilename(filename(href))
        ebook.media[padLeftfilename(id)].mediatype = mediatype
        ebook.media[padLeftfilename(id)].content = data
      })
    })
    createlist()
    setstatus('อ่านหนังสือแล้ว...')
    console.log(ebook)
    return ebook
  })
  .catch((e)=>{
    console.log(e)
    alert('ไฟล์ที่เลือกไม่ใช่ไฟล์ epub หรือรูปแบบไฟล์ไม่ถูกต้อง')
  })
}



const dacreatelist = ()=>{
  const table = $('#sectionlist').DataTable({
      destroy: true,
      paging: false,
      data: ebook.section,
      columns: [
        {
          name: 'id',
          title: 'ลำดับ',
          data: null,
          createdCell: (cell)=>{
            cell.setAttribute('class', 'one wide column')
          },
          render: (data, type, full, meta)=>{
            console.log(meta)
            if (type === 'display') {
              const row = meta.row - 1
              return (row < 0) ? '#' : row
            }
            return data
          }
        },
        {
          name: 'href',
          title: 'ชื่อไฟล์',
          data: 'href',
          searchable: true,
          sortable: false,
          createdCell: (cell)=>{
            let original
            cell.setAttribute('class', 'four wide column')
            cell.setAttribute('contenteditable', true)
            cell.setAttribute('spellcheck', false)
            cell.addEventListener('focus', function(e) {
              original = e.target.textContent
            })
            cell.addEventListener('blur', function(e) {
              if (original !== e.target.textContent) {
                const row = table.row(e.target.parentElement)
                //row.invalidate()
                console.log('Row changed: ', row.data(), e.target)
              }
            })
          }
        },
        {
          name: 'title',
          title: 'ชื่อตอน',
          data: 'title',
          searchable: true,
          sortable: false,
          createdCell: (cell)=>{
            let original
            cell.setAttribute('contenteditable', true)
            cell.setAttribute('spellcheck', false)
            cell.addEventListener('focus', function(e) {
              original = e.target.textContent
            })
            cell.addEventListener('blur', function(e) {
              if (original !== e.target.textContent) {
                const row = table.row(e.target.parentElement)
                //row.invalidate()
                console.log('Row changed: ', row.data(), e.target)
              }
            })
          }
        },
        {
          name: 'action',
          title: '<i class="cubes icon"></i>',
          data: null,
          searchable: false,
          sortable: false,
          createdCell: (cell)=>{
            cell.setAttribute('class', 'two wide column right aligned')
          },
          render: (data, type, full, meta)=>{
            if (type === 'display') {
              var $span = $('<span></span>')
              if (meta.row > 0) {
                $('-').appendTo($span)
              }
              $('-').appendTo($span)
              return $span.html()
            }
            return data;
          }
        }
      ],
      columnDefs: [{ 
        targets: [1, 2],
        createdCell: (cell)=>{

        }
      }]
    }
  ) 
}

/* ส่วนแสดงรายการ */
const createlist = ()=>{
  const sectionlist = []
  let row = -1
  ebook.section = Object.fromEntries(Object.entries(ebook.section)) //แก้ปัญหารายการข้าม
  $.each(ebook.section, (idx)=>{
    let title = readtitle(ebook.section[idx])
    sectionlist.push('<tr data-id="' + idx + '"><td>' + ((row < 0) ? '#': row) + '</td>')
    sectionlist.push('<td class="sectionhref" data-id="' + ebook.section[idx].id 
     + '" data-href="' + ebook.section[idx].href + '" contentEditable="true">'
     + ebook.section[idx].href + '</td>')
    sectionlist.push('<td class="sectiontitle" contentEditable="true">' + title + '</td>')
    const tools = (idx == 0) ? '' : '<i class="sectiondelete delete icon"></i>'
    sectionlist.push('<td class="sectiontool right aligned"><i class="sectionedit file code icon"></i>'
     + tools + '<i class="sectioninsert outdent icon"></i></td><tr>')
    row++
  })
  $('#sectionlist').html(sectionlist.join('\n'))
  $('#sectionlist .sectionhref').each((idx, node)=>{
    node.addEventListener('focusout', (e)=>{
      const sectionid = e.target.parentNode.dataset.id
      const newname = e.target.textContent
      const oldid = e.target.dataset.id
      const newid = 'x' + newname
      if(oldid == newid) return
      if(ebook.media.hasOwnProperty(newid)){
        e.target.textContent = e.target.dataset.href
        alert('ไฟล์ชื่อ' + newname + 'มีอยู่แล้ว')
        return
      }
      ebook.section[sectionid].href = newname
      ebook.media[ebook.section[sectionid].id].href = newname
      ebook.section[sectionid].id = newid
      e.target.dataset.id = newid
      delete Object.assign(ebook.media, {[newid]: ebook.media[oldid]})[oldid]
      if(sectionid == 0){
        ebook.cover.htmlhref = newname
        ebook.cover.htmlid = newid
      }
    })
  })
  $('#sectionlist .sectiontitle').each((idx, node)=>{
    node.addEventListener('focusout', (e)=>{
      const sectionid = e.target.parentNode.dataset.id
      const mediaid = ebook.section[sectionid].id
      const newtitle = cleantag(e.target.textContent)
      e.target.textContent = newtitle //ลบ style ที่ติดมาตอนคัดลอก
      ebook.section[sectionid].title = newtitle
      ebook.media[mediaid].content = ebook.media[mediaid].content.replace(
        /<(h[1-6]).class="(.*)">.*<\/h[1-6]>/i,
        '<$1 class="$2">' + toHtmlEntities(newtitle) + '</$1>')
    })
  })
  $('#sectionlist .sectionedit').each((idx, node)=>{
    node.addEventListener('click', (e)=>{
      const sectionid = e.target.parentNode.parentNode.dataset.id
      const mediaid = ebook.section[sectionid].id
      const section = ebook.media[mediaid].content
      const title = (ebook.section[sectionid].title == '')
        ? 'ไม่มีหัวเรื่อง' : ebook.section[sectionid].title
      $('.overlay').dimmer('show')
      $('#editertitle').text(title)
      $('#editercontent')[0].value = section
      $('#editercontent').attr('data-mediaid', ebook.section[sectionid].id)
      $('#editercontent').attr('data-sectionid', sectionid)
    })
  })
  $('#sectionlist .sectiondelete').each((idx, node)=>{
    node.addEventListener('click', (e)=>{
      //const deletesection = confirm('แน่ใจว่าจะลบ?')
      //if(deletesection){
        const sectionid = e.target.parentNode.parentNode.dataset.id
        const mediaid = ebook.section[sectionid].id
        delete ebook.section[sectionid]
        delete ebook.media[mediaid]
        createlist()
      //}
    })
  })
  $('#sectionlist .sectioninsert').each((idx, node)=>{
    node.addEventListener('click', (e)=>{
      const sectionid = parseInt(e.target.parentNode.parentNode.dataset.id)
      $('#mediafile').click()
      mediafile.onchange = (mediafiles)=>{
        addmedia(mediafiles, sectionid + 1)
      }
    })
  })
}

const readtitle = (section)=>{
  if (section.subsection){
    return section.title + ' / ' + readtitle(section.subsection)
  }else{
    return section.title
  }
}

/* ส่วนแก้ไขรายละเอียด */
$('#filename, #title, #creator, #description, #publisher').each((idx, node)=>{
  node.addEventListener('focusout', (e)=>{
    const value = cleantag(e.target.textContent)
    ebook.bookinfo[e.target.id] = value
    e.target.textContent = (value == '') ? '-' : toHtmlEntities(value) //ลบ style ที่ติดมาตอนคัดลอก
    const filename = filenamify('[' + ebook.bookinfo.creator + '] ' + ebook.bookinfo.title, {replacement: ''})
    if(e.target.id == 'title'){
      document.title = appname + ' - ' + ((value == '') ? 'ยังไม่มีชื่อเรื่อง' : value)
      $('#filename').text(filename)
      ebook.section[1].title = value
      ebook.bookinfo.filename = filename
      ebook.media[ebook.section[1].id].content = ebook.media[ebook.section[1].id].content.replace(
        /<(h[1-6]).class="(.*)">.*<\/h[1-6]>/i,
        '<$1 class="$2">' + value + '</$1>')
      createlist()
    }
    if(e.target.id == 'creator'){
      ebook.bookinfo.filename = filename
      $('#filename').text(filename)
    }
  })
})

/* ส่วนแก้ไขไฟล์ */
editercancle.onclick = (e)=>{
  $('.overlay').dimmer('hide')
}

editersave.onclick = (e)=>{
  const editer = $('#editercontent')
  let newtitle = /<h[1-6].class=".*">(.*)<\/h[1-6]>/i.exec(editer[0].value)
  newtitle = (newtitle) ? newtitle[1] : '***ไม่พบชื่อตอน***'
  const content = cleanwhiteline(editer[0].value)
  ebook.media[editer.attr('data-mediaid')].content = content
  ebook.section[editer.attr('data-sectionid')].title = fromHtmlEntities(newtitle)
  createlist()
  $('.overlay').dimmer('hide')
}


/* ส่วนบักทึกไฟล์หนังสือ */
savefile.onclick = async(e)=>{
  setstatus('กำลังสร้างไฟล์หนังสือ...', false)
  const book = new JSZip()
  await book.file('mimetype', 'application/epub+zip')
  await book.file('META-INF/container.xml', xmlBuilder.build(containerElements))
  await book.file('META-INF/com.apple.ibooks.display-options.xml', xmlBuilder.build(ibooksDisplay))
  await book.file('OEBPS/content.opf', generateopf())
  await book.file('OEBPS/toc.ncx', generatencx())
  $.each(ebook.media, async(idx, e)=>{
    switch (e.mediatype) {
      case 'application/xhtml+xml':
      case 'text/html':
        await book.file('OEBPS/Text/' + e.href, cleanwhiteline(e.content))
      break
      case 'text/css':
        await book.file('OEBPS/Styles/' + e.href, cleanwhiteline(e.content))
      break
      break        
      case 'application/vnd.ms-opentype':
      case 'application/x-font-ttf':
      case 'font/otf':
      case 'font/ttf':
        await book.file('OEBPS/Fonts/' + e.href, e.content, {binary: true})
      break
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        await book.file('OEBPS/Images/' + e.href, e.content, {binary: true})        
      break
      case 'application/x-javascript':
      default:
        await book.file('OEBPS/Misc/' + e.href, e.content)
      break
    }
  })
  await book.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: {level: compressionLevel}
  }, (e)=>{
    const file = e.currentFile ? filename(e.currentFile) : ''
    setstatus('กำลังสร้างไฟล์...' + e.percent.toFixed(2) + '% (ไฟล์ ' + file + ')', false)
  }).then((blob)=>{
    setstatus('สร้างไฟล์หนังสือแล้ว...')
    saveAs(blob, ebook.bookinfo.filename + '.epub')
  })
}

const generateopf = ()=>{
  const info = ebook.bookinfo
  let opfElements = new opfElementsTemplate()
  opfElements.package.metadata['dc:title'] = info.title
  opfElements.package.metadata['dc:creator'] = info.creator
  opfElements.package.metadata['dc:description'] = info.description
  opfElements.package.metadata['dc:publisher'] = info.publisher
  opfElements.package.metadata['dc:date']['#text'] = new Date().toISOString().slice(0, 10)
  opfElements.package.metadata['dc:identifier']['#text'] = info.identifier
  const meta = []
  meta.push({'@name': appname, '@content': version})
  meta.push({'@name': 'Template owner', '@content': 'Sunsettia'})
  meta.push({'@name': 'cover', '@content': ebook.cover.imageid})
  opfElements.package.metadata.meta = meta
  opfElements.package.manifest.item.push({
    '@id': 'toc', '@href': 'toc.ncx', '@media-type': 'application/x-dtbncx+xml'})
  $.each(ebook.media, (idx, media)=>{
    let href
    switch (media.mediatype) {
      case 'application/xhtml+xml':
      case 'text/html':
        href = 'Text/' + media.href
      break
      case 'text/css':
        href = 'Styles/' + media.href
      break
      case 'application/vnd.ms-opentype':
      case 'application/x-font-ttf':
      case 'font/otf':
      case 'font/ttf':
        href = 'Fonts/' + media.href
      break
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        href = 'Images/' + media.href
      break
      default:
        href = 'Misc/' + media.href
      break
    }
    opfElements.package.manifest.item.push({
      '@id': idx, '@href': href, '@media-type': media.mediatype})
  })
  $.each(ebook.section, (idx, section)=>{
    if(idx == 0){
      opfElements.package.spine.itemref.push({'@idref': section.id, '@linear': 'no'})
    }else{
      opfElements.package.spine.itemref.push({'@idref': section.id})
    }
  })
  opfElements.package.guide.reference = {
    '@type': 'cover', '@title': 'หน้าปก', '@href': 'Text/' + ebook.cover.htmlhref}
  return xmlBuilder.build(opfElements)
}

const generatencx = ()=>{
  let ncxElements = {}
  let maxdepth = 1
  let currentdepth = 1
  let playorder = 1
  let anavPoint = []
  let currentnavPoint = []
  let ncx = {}
  ncxElements = new ncxElementsTemplate()
  ncxElements.ncx.docTitle.text = ebook.bookinfo.title
  Object.keys(ebook.section).forEach((key)=>{
    const point = ebook.section[key] 
    if(point.title == '') return
    const navPoint = {}
    navPoint['@id'] = 'navPoint-' + playorder
    navPoint['@playOrder'] = playorder
    navPoint.navLabel = {}
    navPoint.navLabel.text = toHtmlEntities(point.title.trim())
    navPoint.content = {}
    navPoint.content['@src'] = 'Text/' + point.href
    /*
      if(ebook.section[parseInt(key)-1].depth < 0) {
        ncx[key] = navPoint
      }else if(ebook.section[parseInt(key)-1].depth == ebook.section[key].depth){
        ncx[key] = navPoint
      }else{
        for(let i = key; i > 0; i--){
          console.log(ebook.section[i].depth < ebook.section[key].depth)
          if(ebook.section[i].depth < ebook.section[key].depth){
            ncx[i].navPoint = ncx[i].navPoint || []
            ncx[i].navPoint.push(navPoint)
            i = 0
          }else if(ebook.section[i].depth == ebook.section[key].depth){
            ncx[key] = navPoint
            //i = 0
          }
        }
      }
    console.log(ncx)
    */
    currentnavPoint.push(navPoint)
    currentdepth = point.depth
    playorder++
  })
  ncxElements.ncx.navMap.navPoint = currentnavPoint
  ncxElements.ncx.head.meta.push({'@name': 'dtb:uid', '@content': ebook.bookinfo.identifier})
  ncxElements.ncx.head.meta.push({'@name': 'dtb:depth', '@content': maxdepth})
  ncxElements.ncx.head.meta.push({'@name': 'dtb:totalPageCount', '@content': '0'})
  ncxElements.ncx.head.meta.push({'@name': 'dtb:maxPageNumber', '@content': '0'}) 
  return xmlBuilder.build(ncxElements)
}

/* ส่วนเปลี่ยนปก */
$('#cover, #addcover').each((idx, node)=>{
  node.addEventListener('click', (e)=>{
    $('#coverfile')[0].click()
  })
})

coverfile.onchange = async(file)=>{
  const coverfile = file.target.files[0]
  const reader = await new Response(coverfile).arrayBuffer()
  if(coverfile.type != 'image/jpeg' && coverfile.type != 'image/png'){
    console.log('Mimetype not support', coverfile.type)
    alert('ไฟล์ปกจะต้องเป็นรูปภาพ jpg หรือ png เท่านั้น')
    return
  }
  const blob = new Blob([reader], {type: coverfile.type})
  ebook.cover.mediatype = coverfile.type
  ebook.media[ebook.cover.imageid].content = reader
  const img = new Image
  img.onload = async(e)=>{
    ebook.cover.imagewidth = e.target.naturalWidth
    ebook.cover.imageheight = e.target.naturalHeight
    let xhtml = ['']
    xhtml.push('<div style="text-align: center; padding: 0pt; margin: 0pt;">')
    xhtml.push('<svg xmlns="http://www.w3.org/2000/svg" height="100%" '
     + 'preserveAspectRatio="xMidYMid meet" version="1.1" viewBox="0 0 '
     + ebook.cover.imagewidth + ' ' + ebook.cover.imageheight + '" '
     + 'width="100%" xmlns:xlink="http://www.w3.org/1999/xlink">')
    xhtml.push('<image width="' + ebook.cover.imagewidth + '" '
     + 'height="' + ebook.cover.imageheight + '" '
     + 'xlink:href="../Images/' + filename(ebook.cover.imagehref) + '"/>')
    xhtml.push('</svg>\n</div>\n')
    htmlElements.html.body = xhtml.join('\n')
    xhtml = cleanwhiteline(xmlBuilder.build(htmlElements))
    ebook.media[ebook.cover.htmlid].content = xhtml
  }
  img.src = URL.createObjectURL(blob)
  $('#cover').html(img)
  setstatus('เปลี่ยนปกหนังสือแล้ว...')
}


/* ส่วนเพิ่มไฟล์ */
addfile.onclick = (e)=>{
  $('#mediafile').click()
}

mediafile.onchange = (mediafiles)=>{
  addmedia(mediafiles)
}

const addmedia = async(mediafiles, insertid)=>{
  insertid = insertid || 0
  setstatus('กำลังเพิ่มไฟล์...', false)
  let sortFile = {}
  Object.keys(mediafiles.target.files).forEach((e)=>{
    sortFile[mediafiles.target.files[e].name] = mediafiles.target.files[e]
  })
  //sortFile = Object.entries(sortFile).sort().reduce((o,[k,v])=>(o[k]=v,o), {})
  sortFile = Object.fromEntries(Object.entries(sortFile)
    .sort((a, b) => a[0].localeCompare(b[0], 'en', {numeric: true})))
  try { /// ดัก error
    await Object.keys(sortFile).reduce(async(promise, idx)=>{
      await promise
      const file = sortFile[idx]
      setstatus('กำลังเพิ่มไฟล์...' + file.name, false)
      if(file.size == 0){
        alert('ไฟล์ชื่อ ' + file.name + ' ขนาดไฟล์ศูนย์ไบต์ไม่สามารถเพิ่มได้')      
        return
      }
      const filename = file.name.replace(/\s/g, '-')
      const extension = filenameExtension(file.name)
      let media = {}
      let mediaid = ''
      let newsection = {}
      let addsection = false
      const mediatype = (file.type == 'text/plain' && extension != 'txt') ? 'Unknow' : file.type
      media.mediatype = file.type
      switch(mediatype) {
        case 'text/plain':
          addsection = true
          media.mediatype = 'application/xhtml+xml'
          media.href = filenameFromTitle(filenameWithoutExtension(filename))
          mediaid = 'x' + media.href
          let content = await new Response(file).text()
          const xhtmlstring = converttexttoxhtml(content)
          media.content = xhtmlstring.html
          newsection = {
            id: mediaid,
            href: media.href,
            title: xhtmlstring.title
          }
        break
        case 'text/html':
        case 'application/xhtml+xml':
          addsection = true
          media.href = filename
          mediaid = 'x' + filename
          media.content = await new Response(file).text()
          const newtitle = /<h[1-6].class=".*">(.*)<\/h[1-6]>/i.exec(media.content)
          newsection = {
            id: 'x' + filename,
            href: filename,
            title: newtitle[1]
          }
        break
        case 'text/css':
        case 'application/x-javascript':
          mediaid = filename
          media.href = filename
          media.content = await new Response(file).text()
        break
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
          mediaid = 'x' + filename
          media.href = filename
          media.content = await new Response(file).arrayBuffer()
        break
        default:
          mediaid = filename
          media.href = filename
          media.content = await new Response(file).arrayBuffer()
          if(extension == 'ttf'){
            media.mediatype = 'application/x-font-ttf'
          }else if(extension == 'otf'){
            media.mediatype = 'application/vnd.ms-opentype'
          }else{
            alert('ไฟล์ชื่อ ' + file.name + ' ไม่รองรับไม่สามารถเพิ่มได้')
            console.log('Unsupport filename:', filename, 'type:', mediatype)
            return
          }
        break
      }
      if(ebook.media.hasOwnProperty(mediaid)){
        alert('ไฟล์ชื่อ ' + file.name + ' นี้มีแล้วไม่สามารถเพิ่มได้')
      }else{
        ebook.media[mediaid] = media
        if(addsection == true){
          if(insertid == 0){
            const sectioncount = Object.keys(ebook.section).length
            ebook.section[sectioncount] = newsection
            //console.log(sectioncount)
          }else if(insertid){
            const firstpart = Object.entries(ebook.section).slice(0,(insertid)).map(e => e[1])
            const lastpart = Object.entries(ebook.section).slice(insertid).map(e => e[1])
            firstpart[insertid] = newsection
            Object.entries(lastpart).map(e => firstpart[insertid + parseInt(e[0]) + 1] = e[1])
            ebook.section = firstpart
            insertid++
            //console.log(insertid)
          }
        }
      }
    }, Promise.resolve())
  } catch (e) { /// ดัก error
    console.error(e.message)
  }
  setstatus('เพิ่มไฟล์แล้ว...')
  createlist()
}

const converttexttoxhtml = (text)=>{
  const out = {}
  let xhtml = ['']
  text = toHtmlEntities(text).replace(/\r/g, '').split('\n').filter(String)
  if(text[0].indexOf('http') != -1){
    text.splice(0, 1)
  }
  out.title = text[0].trim()
  text.forEach((line, idx)=>{
    line = line.trim()
    if(line == '') return
    if(idx == 0){
      xhtml.push('<h3 class="chapter_heading">' + line + '</h3>')
    }else{
      xhtml.push('<p class="p_normal">' + line + '</p>')
    }
  })
  xhtml.push('')
  htmlElements.html.body = xhtml.join('\n')
  xhtml = cleanwhiteline(xmlBuilder.build(htmlElements))
  htmlgen.forEach(e => xhtml = xhtml.replace(e[0], e[1]))
  out.html = xhtml
  return out
}

reloadlist.onclick = ()=>{
  createlist()
}

chapterToFilename.onclick = ()=>{
  Object.keys(ebook.section).forEach((row)=>{
    const chapterrow = ebook.section[row]
    let filename = filenameFromTitle(chapterrow.title)
    if(filename == false || /cover|description/i.test(ebook.section[row].href) == true) return
    const oldid = chapterrow.id
    let newid = 'x' + filename
    if(ebook.media.hasOwnProperty(newid)){
      filename = 'r' + Math.random(1000) + '.xhtml'
      newid = 'x' + filename
      alert('ไฟล์ชื่อ' + filenameFromTitle(chapterrow.title) + ' มีอยู่แล้วถูกเปลี่ยนชื่อเป็น ' + filename)
    }
    ebook.section[row].id = newid
    ebook.section[row].href = filename
    ebook.media[oldid].href = filename
    delete Object.assign(ebook.media, {[newid]: ebook.media[oldid]})[oldid]
  })
  createlist()
}

restructure.onclick = ()=>{
  $.each(ebook.media, (idx, content)=>{
    const mediatype = content.mediatype
    switch (mediatype) {
      case 'application/xhtml+xml':
      case 'text/html':
        break
      case 'text/css':
        break
      default:
        break
    }
  })

/*
text = text.replace(/<wiki>(.+?)<\/wiki>/g, function(match, contents, offset, input_string){
        return "<a href='wiki/"+contents.replace(/ /g, '_')+"'>"+contents+"</a>"
    })
  data = data.replace(/&#13/ig, '')
  data = data.replace(/<link.*href="(.*css)".*?>/g, '<link href="..\/Styles\/' + filename($1) + '" type="text\/css"\/>')
  //data = data.replace(/(<img.*src=".*\/(.*(jpg|jpeg|png|gif)))".*?>/g, 'img:$1$2')
  console.log(data)
  const d = $($.parseXML(data))
  const x = d.find('img') || false
  if(x.attr('src')){
  x.attr('src', '../Images/' + filename(x.attr('src')))
  console.log($('<div>').append(d).clone()).html()
  //data = $($.parseXML(data)).text().replace(/\r/g, '').split('\n').map(e=>e.trim()).filter(String)
*/        

}


/* ส่วนฟังก์ชั่นทั่วไป */
const submenu = $('#tools .menu')[0]
const toolsmenu = $('#tools')[0]
toolsmenu.onmouseover = (e)=>{
  if ((toolsmenu.contains(e.target))) {
    submenu.style.display = 'inline'
    submenu.style.marginTop = '0px'
  }
}

toolsmenu.onmouseout = (e)=>{
  submenu.style.display = 'none'
}

toolsmenu.onclick = (e)=>{
  submenu.style.display = 'none'
}

const setstatus = (str, hide)=>{
  hide = (typeof hide !== 'undefined') ? hide : true
  str = '<i class="exclamation circle icon"></i><span>' + str + '</span>'
  $('#status').show()
  $('#status').html(str)
  if(hide){
    setTimeout(()=>{
      $('#status').hide()
    }, 1000)
  }
}