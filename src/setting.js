const appname = 'Bronya'
const version = '0.1.5'
const newbookName = 'NewBook'
const templatePath = './template/template-full.epub'
const compressionLevel = 9
const maxLengthAutoRename = 10

const xmlOption = {
  ignoreAttributes: false,
  attributeNamePrefix : '@',
  suppressEmptyNode: true,
  allowBooleanAttributes: true,
  suppressUnpairedNode: true,
  unpairedTags: ['!DOCTYPE'],
  suppressBooleanAttributes: true,
  processEntities: false,
  format: true,
  isArray: (name, jpath, isLeafNode, isAttribute)=>{ 
    const alwaysArray = [
      'ncx.navMap.navPoint',
      'ncx.navMap.navPoint.navPoint',
      'ncx.navMap.navPoint.navPoint.navPoint',
      'ncx.navMap.navPoint.navPoint.navPoint.navPoint',
      'ncx.navMap.navPoint.navPoint.navPoint.navPoint.navPoint',
      'package.spine.itemref',
      'package.guide.reference'
    ];
    if(alwaysArray.indexOf(jpath) !== -1) return true
  }
}

const htmlgen = [
  [/[\u200b|\u200c|\u200d|\uFEFF|\u2028]/g, ''],
  [/\s{2,}/g, ' '],
  [/ไอลีนโนเวล/, ''],
  //[/([^']*)/g, '‘$1’'],
  //[/([^"]*)/g, '“$1”'],
  [/(\.{3,10}|…\.{1,5})/g, '……'],
  [/([　-龯Ⅰ-Ⅿ＀-ﾟ①-⒀―-‗„-‥‧-↓★☆◇◆●♪▼]+)/g, '<em class="small">$1</em>'],
  [/\[s\](.*)\[\/s\]/ig, '<em class="small">$1</em>'],
  [/\[i\]([^\[]*)\[\/i\]/ig, '<em class="italic">$1</em>'],
  [/\[b\](.*)\[\/b\]/ig, '<em class="bold">$1</em>'],
  [/\[img\](.*)\[\/img\]/ig, '<img alt="$1" src="../Images/$1"/>'],
  [/\[hr\]/ig, '<hr/>'],
  [/\[url=(.*)\](.*)\[\/url\]/ig, '<a href="$1">$2</a>'],
  [/\[color=(.*)\]([^\[]*)\[\/color\]/ig, '<em style="color:$1">$2</em>'],
  [/<p.*\[(\/?)(blockquote|bq)\].*/ig, '<$1blockquote>']
 ]