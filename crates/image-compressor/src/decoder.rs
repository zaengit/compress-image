use image::{DynamicImage, ImageFormat};
pub fn decode(input:&[u8])->Result<DynamicImage,String>{
 let format=image::guess_format(input).map_err(|e|e.to_string())?;
 if !matches!(format,ImageFormat::Jpeg|ImageFormat::Png|ImageFormat::WebP){return Err("Unsupported image format".into());}
 image::load_from_memory_with_format(input,format).map_err(|e|format!("Decode failed: {e}"))
}
