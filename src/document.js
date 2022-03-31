const xmlschema = {}
xmlschema['@version'] = '1.0'
xmlschema['@encoding'] = 'utf-8'

const containerElements = {}
containerElements['?xml'] = xmlschema
containerElements.container = {}
containerElements.container['@version'] = '1.0'
containerElements.container['@xmlns'] = 'urn:oasis:names:tc:opendocument:xmlns:container'
containerElements.container.rootfiles = {}
containerElements.container.rootfiles.rootfile = {}
containerElements.container.rootfiles.rootfile['@full-path'] = 'OEBPS/content.opf'
containerElements.container.rootfiles.rootfile['@media-type'] = 'application/oebps-package+xml'

const ibooksDisplay = {}
ibooksDisplay['?xml'] = xmlschema
ibooksDisplay.display_options = {}
ibooksDisplay.display_options.platform = {}
ibooksDisplay.display_options.platform['@name'] = '*'
ibooksDisplay.display_options.platform.option = {}
ibooksDisplay.display_options.platform.option['@name'] = 'specified-fonts'
ibooksDisplay.display_options.platform.option['#text'] = true
//ibooksDisplay.display_options.platform.option['@name'] = 'interactive'
//ibooksDisplay.display_options.platform.option['#text'] = false
//ibooksDisplay.display_options.platform.option['@name'] = 'fixed-layout'
//ibooksDisplay.display_options.platform.option['#text'] = false
//ibooksDisplay.display_options.platform.option['@name'] = 'open-to-spread'
//ibooksDisplay.display_options.platform.option['#text'] = false
//ibooksDisplay.display_options.platform.option['@name'] = 'orientation-lock'
//ibooksDisplay.display_options.platform.option['#text'] = 'none'

const htmlElements = {}
htmlElements['?xml'] = xmlschema
htmlElements['!DOCTYPE'] = {}
htmlElements['!DOCTYPE']['#text'] = ''
htmlElements['!DOCTYPE']['@html'] = true
htmlElements['!DOCTYPE']['@PUBLIC'] = true
htmlElements['!DOCTYPE']['@"-//W3C//DTD XHTML 1.1//EN"'] = true
htmlElements['!DOCTYPE']['@"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"'] = true
htmlElements.html = {}
htmlElements.html['@xmlns'] = 'http://www.w3.org/1999/xhtml'
htmlElements.html.head = {}
htmlElements.html.head.meta = {}
htmlElements.html.head.meta['@content'] = ''
htmlElements.html.head.meta['@name'] = 'viewport'
htmlElements.html.head.link = {}
htmlElements.html.head.link['@href'] = '../Styles/style.css'
htmlElements.html.head.link['@rel'] = 'stylesheet'
htmlElements.html.head.link['@type'] = 'text/css'
htmlElements.html.head.title = ''
htmlElements.html.body = {}
htmlElements.html.body.p = []

function ncxElementsTemplate (){
  const ncxElements = {}
  ncxElements['?xml'] = xmlschema
  ncxElements['!DOCTYPE'] = {}
  ncxElements['!DOCTYPE']['#text'] = ''
  ncxElements['!DOCTYPE']['@ncx'] = true
  ncxElements['!DOCTYPE']['@PUBLIC'] = true
  ncxElements['!DOCTYPE']['@"-//NISO//DTD ncx 2005-1//EN"'] = true
  ncxElements['!DOCTYPE']['@"http://www.daisy.org/z3986/2005/ncx-2005-1.dtd"'] = true
  ncxElements.ncx = {}
  ncxElements.ncx['@version'] = '2005-1'
  ncxElements.ncx['@xmlns'] = 'http://www.daisy.org/z3986/2005/ncx/'
  ncxElements.ncx.head = {}
  ncxElements.ncx.head.meta = []
  ncxElements.ncx.docTitle = {}
  ncxElements.ncx.navMap = {}
  ncxElements.ncx.navMap.navPoint = []
  return ncxElements
}

function opfElementsTemplate (){
  const opfElements = {}
  opfElements['?xml'] =  xmlschema
  opfElements.package = {}
  opfElements.package['@version'] = '2.0'
  opfElements.package['@unique-identifier'] = 'BookId'
  opfElements.package['@xmlns'] = 'http://www.idpf.org/2007/opf'
  opfElements.package.metadata = {}
  opfElements.package.metadata['@xmlns:dc'] = 'http://purl.org/dc/elements/1.1/'
  opfElements.package.metadata['@xmlns:dcterms'] = 'http://purl.org/dc/terms/'
  opfElements.package.metadata['@xmlns:opf'] = 'http://www.idpf.org/2007/opf'
  opfElements.package.metadata['@xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance'
  opfElements.package.metadata.meta = []
  opfElements.package.metadata['dc:language'] = 'th'
  opfElements.package.metadata['dc:date'] = {}
  opfElements.package.metadata['dc:date']['@opf:event'] = 'modification'
  opfElements.package.metadata['dc:identifier'] = {}
  opfElements.package.metadata['dc:identifier']['@id'] = 'BookId'
  opfElements.package.metadata['dc:identifier']['@opf:scheme'] = 'UUID'
  opfElements.package.manifest = {}
  opfElements.package.manifest.item = []
  opfElements.package.spine = {}
  opfElements.package.spine.itemref = []
  opfElements.package.spine['@toc'] = 'toc'
  opfElements.package.guide = {}
  opfElements.package.guide.reference = {}
  return opfElements
}