const generateUUID = ()=>{
    return 'urn:uuid:' + ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
      c =>(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }
 
const pathDirectory = (pathname)=>{
  return pathname.split('/').slice(0, -1).join('/') + '/'
} 
  
const filename = (pathname)=>{
    return pathname.split('\\').pop().split('/').pop()
  }

const filenameWithoutExtension = (pathname)=>{
    return pathname.split('.').slice(0, -1).join('.')
  }
const filenameExtension = (pathname)=>{
    return pathname.split('.').pop()
  }
  
const toHtmlEntities = (str)=>{
    return $("<textarea/>").text(str).html()
  }

const fromHtmlEntities = (str)=>{
    return $("<textarea/>").html(str).text()
  }

const padLeft = (str, len)=>{
    len = len || 4
    return str.toString().padStart(len, '0')
  }

const findvalue = (array, findkey, findvalue, value)=>{
  return array.find(e => e[findkey] == findvalue)[value]
}

const filenameFromTitle = (title)=>{
  if(title == '') return false
  if(/[^0-9A-Za-z_\-\.\(\)]/.test(title)
  | title.length >= maxLengthAutoRename){
    const chapternumber = /(\d+)[\.-]?(\d+)?/.exec(title)
    if(chapternumber != null){
      const subchapter = chapternumber[2] ? '-' + chapternumber[2] : ''
      return padLeft(chapternumber[1]) + subchapter + '.xhtml'
    }else{
      return 'r' + Math.random(1000) + '.xhtml'
    }
  }else{
    return padLeft(title).replace(' ', '-') + '.xhtml'
  }
}


// เปลี่ยนชื่อไฟล์จาก 3 หลักเป็น 4 หลัก
const padLeftfilename = (str)=>{
  const chapternumber = /^(x?)(\d{1,3})\.xhtml/.exec(str)
  if(chapternumber != null){
    return chapternumber[1] + chapternumber[2].toString().padStart(4, '0') + '.xhtml'
  }else{
    return str
  }
}

const cleanwhiteline = (str)=>{
  return str.replace(/[\r\n|\n]{2,}/g, '\n').replace(/\n\s+/g, '\n').replace(/&#13/g, '')
}

const cleantag = (str)=>{
  return str.replace(/<[^>]*>?/g, '').replace(/(\n|\s+)/g, ' ').trim()
}

// ยังไม่ได้ใช้
const escapeHTML = str => str.replace(/[&<>'"]/g, 
  tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag]))
const unescapedHTML = str => str.replace(/&(\D+);/gi,
    tag => ({
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&#39;': "'",
          '&quot;': '"',
      }[tag])
    )


    function last(array) {
      const length = array == null ? 0 : array.length
      return length ? array[length - 1] : undefined
    }
