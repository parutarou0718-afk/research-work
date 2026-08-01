//! Native file writer for local plugin exports.
//!
//! Plugin records remain on the user's device. This command receives only an
//! already-rendered export payload and writes it to a user-selected folder;
//! it never reads PandaWiki credentials or documents.

use std::{fs, path::{Path, PathBuf}};

use docx_rs::{Docx, Paragraph, Run};
use printpdf::{Mm, Op, ParsedFont, PdfDocument, PdfFontHandle, PdfPage, PdfSaveOptions, Point, Pt, TextItem};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginExportWriteRequest {
    pub directory: String,
    pub base_name: String,
    pub formats: Vec<String>,
    pub markdown: String,
    pub json: String,
    pub document_title: String,
}

#[tauri::command]
pub fn write_plugin_export(request: PluginExportWriteRequest) -> Result<Vec<String>, String> {
    let directory = PathBuf::from(&request.directory);
    if !directory.is_absolute() {
        return Err("The export folder must be an absolute path.".to_string());
    }
    let base_name = safe_file_name(&request.base_name)?;
    fs::create_dir_all(&directory).map_err(|error| format!("Could not create export folder: {error}"))?;

    let mut written = Vec::new();
    for format in &request.formats {
        let path = match format.as_str() {
            "markdown" => write_text(&directory, &base_name, "md", &request.markdown)?,
            "json" => write_text(&directory, &base_name, "json", &request.json)?,
            "docx" => write_docx(&directory, &base_name, &request.document_title, &request.markdown)?,
            "pdf" => write_pdf(&directory, &base_name, &request.document_title, &request.markdown)?,
            other => return Err(format!("Unsupported plugin export format: {other}")),
        };
        written.push(path.to_string_lossy().into_owned());
    }
    Ok(written)
}

fn safe_file_name(value: &str) -> Result<String, String> {
    let sanitized: String = value
        .trim()
        .chars()
        .map(|ch| if matches!(ch, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*') { '_' } else { ch })
        .collect();
    if sanitized.is_empty() || sanitized == "." || sanitized == ".." {
        return Err("The export file name is invalid.".to_string());
    }
    Ok(sanitized)
}

fn write_text(directory: &Path, base_name: &str, extension: &str, contents: &str) -> Result<PathBuf, String> {
    let path = directory.join(format!("{base_name}.{extension}"));
    fs::write(&path, contents).map_err(|error| format!("Could not write {} export: {error}", extension.to_uppercase()))?;
    Ok(path)
}

fn write_docx(directory: &Path, base_name: &str, title: &str, markdown: &str) -> Result<PathBuf, String> {
    let path = directory.join(format!("{base_name}.docx"));
    let mut document = Docx::new().add_paragraph(
        Paragraph::new().add_run(Run::new().add_text(title)),
    );
    for line in markdown.lines().filter(|line| !line.starts_with("# ")) {
        document = document.add_paragraph(Paragraph::new().add_run(Run::new().add_text(line)));
    }
    let file = fs::File::create(&path).map_err(|error| format!("Could not create DOCX export: {error}"))?;
    document.build().pack(file).map_err(|error| format!("Could not write DOCX export: {error}"))?;
    Ok(path)
}

fn candidate_font_paths() -> &'static [&'static str] {
    &[
        "C:\\Windows\\Fonts\\msyh.ttc",
        "C:\\Windows\\Fonts\\msyh.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    ]
}

fn write_pdf(directory: &Path, base_name: &str, title: &str, markdown: &str) -> Result<PathBuf, String> {
    let font_path = candidate_font_paths().iter().map(Path::new).find(|path| path.is_file())
        .ok_or_else(|| "PDF export requires a supported system font. Install Microsoft YaHei or Noto Sans CJK.".to_string())?;
    let bytes = fs::read(font_path).map_err(|error| format!("Could not read PDF font: {error}"))?;
    let mut font_warnings = Vec::new();
    let font = ParsedFont::from_bytes(&bytes, 0, &mut font_warnings)
        .ok_or_else(|| "Could not load the system font for PDF export.".to_string())?;
    let mut document = PdfDocument::new(title);
    let font_id = document.add_font(&font);
    let lines = wrap_lines(markdown, 46);
    let mut pages = Vec::new();
    for chunk in lines.chunks(42) {
        let mut ops = vec![
            Op::StartTextSection,
            Op::SetTextCursor { pos: Point { x: Mm(15.0).into(), y: Mm(280.0).into() } },
            Op::SetLineHeight { lh: Pt(14.0) },
            Op::SetFont { font: PdfFontHandle::External(font_id.clone()), size: Pt(11.0) },
        ];
        for line in chunk {
            ops.push(Op::ShowText { items: vec![TextItem::Text(line.to_string())] });
            ops.push(Op::AddLineBreak);
        }
        ops.push(Op::EndTextSection);
        pages.push(PdfPage::new(Mm(210.0), Mm(297.0), ops));
    }
    let mut warnings = Vec::new();
    let bytes = document.with_pages(pages).save(&PdfSaveOptions { subset_fonts: true, ..Default::default() }, &mut warnings);
    let path = directory.join(format!("{base_name}.pdf"));
    fs::write(&path, bytes).map_err(|error| format!("Could not write PDF export: {error}"))?;
    Ok(path)
}

fn wrap_lines(value: &str, width: usize) -> Vec<String> {
    let mut result = Vec::new();
    for source in value.lines() {
        let chars: Vec<char> = source.chars().collect();
        if chars.is_empty() { result.push(String::new()); continue; }
        for chunk in chars.chunks(width) { result.push(chunk.iter().collect()); }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::safe_file_name;

    #[test]
    fn sanitizes_windows_file_name_characters() {
        assert_eq!(safe_file_name("A/B: C").unwrap(), "A_B_ C");
        assert!(safe_file_name("..").is_err());
    }
}
