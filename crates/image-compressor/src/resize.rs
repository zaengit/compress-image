use image::{DynamicImage, imageops::FilterType}; use crate::ResizeOptions;
pub fn apply(image:DynamicImage,o:&ResizeOptions)->Result<DynamicImage,String>{
 let (w,h)=(image.width(),image.height()); let Some(v)=o.value else { return Ok(image) }; if o.kind=="original" {return Ok(image)};
 let (mut nw,mut nh)=match o.kind.as_str(){"width"=>(v, if o.maintain_aspect_ratio {((h as f64*v as f64/w as f64).round() as u32).max(1)}else{h}),"height"=>(if o.maintain_aspect_ratio {((w as f64*v as f64/h as f64).round() as u32).max(1)}else{w},v),"max-width"=>{if w<=v{return Ok(image)};(v,((h as f64*v as f64/w as f64).round() as u32).max(1))},"max-height"=>{if h<=v{return Ok(image)};(((w as f64*v as f64/h as f64).round() as u32).max(1),v)},_=>return Ok(image)};
 if o.prevent_enlargement {nw=nw.min(w);nh=nh.min(h);} if nw==w&&nh==h{return Ok(image)} Ok(image.resize_exact(nw.max(1),nh.max(1),FilterType::Lanczos3))
}
