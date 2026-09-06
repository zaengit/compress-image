use image::DynamicImage; use crate::{encoder,similarity};
pub struct SmartResult{pub bytes:Vec<u8>,pub quality:u8,pub similarity:f64}
pub fn compress(original:&DynamicImage,threshold:f64)->Result<SmartResult,String>{
 let qualities=[95u8,92,90,87,85,82,80]; let mut candidates=Vec::new();
 for q in qualities{let bytes=encoder::lossy(original,q)?;let decoded=image::load_from_memory_with_format(&bytes,image::ImageFormat::WebP).map_err(|e|e.to_string())?;let s=similarity::ssim(original,&decoded)?;candidates.push(SmartResult{bytes,quality:q,similarity:s});}
 let mut passing:Vec<_>=candidates.into_iter().filter(|c|c.similarity>=threshold).collect();
 if passing.is_empty(){let bytes=encoder::lossy(original,95)?;let decoded=image::load_from_memory_with_format(&bytes,image::ImageFormat::WebP).map_err(|e|e.to_string())?;return Ok(SmartResult{similarity:similarity::ssim(original,&decoded)?,bytes,quality:95})}
 passing.sort_by_key(|c|c.bytes.len()); Ok(passing.remove(0))
}
