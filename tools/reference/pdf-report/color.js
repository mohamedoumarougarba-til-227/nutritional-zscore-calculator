// Original TIL adapter. Numeric, hex and the basic CSS color names used by this report renderer.
const basic={black:'000000',white:'ffffff',red:'ff0000',green:'008000',blue:'0000ff',gray:'808080',grey:'808080',yellow:'ffff00',cyan:'00ffff',aqua:'00ffff',magenta:'ff00ff',fuchsia:'ff00ff',silver:'c0c0c0',maroon:'800000',olive:'808000',lime:'00ff00',teal:'008080',navy:'000080',purple:'800080'};
export class RGBColor {
 constructor(value){
  this.ok=false;let text=String(value??'').trim().toLowerCase(),rgb;
  if(Object.hasOwn(basic,text))text='#'+basic[text];
  if(/^#?[0-9a-f]{6}$/.test(text)){text=text.replace('#','');rgb=[0,2,4].map(i=>parseInt(text.slice(i,i+2),16));}
  else if(/^#?[0-9a-f]{3}$/.test(text)){text=text.replace('#','');rgb=[...text].map(c=>parseInt(c+c,16));}
  else {const match=/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(text);if(match)rgb=match.slice(1).map(Number);}
  if(rgb?.every(c=>Number.isInteger(c)&&c>=0&&c<=255)){[this.r,this.g,this.b]=rgb;this.ok=true;}
 }
 toHex(){if(!this.ok)throw Error('Invalid report color');return '#'+[this.r,this.g,this.b].map(v=>v.toString(16).padStart(2,'0')).join('');}
 toRGB(){if(!this.ok)throw Error('Invalid report color');return 'rgb('+[this.r,this.g,this.b].join(', ')+')';}
}
