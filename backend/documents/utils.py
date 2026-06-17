import pdfplumber
import docx

def extract_text_from_pdf(file_path):
    text_content = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
    return "\n".join(text_content)

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    text_content = []
    for paragraph in doc.paragraphs:
        if paragraph.text:
            text_content.append(paragraph.text)
    return "\n".join(text_content)

def extract_text_from_txt(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

def extract_document_text(file_path, file_type):
    file_type = file_type.upper()
    if file_type == 'PDF':
        return extract_text_from_pdf(file_path)
    elif file_type == 'DOCX':
        return extract_text_from_docx(file_path)
    elif file_type == 'TXT':
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

def chunk_text(text, chunk_size_words=1500, overlap_words=150):
    """
    Split text into chunks of roughly 2000 tokens (approx 1500 words).
    """
    words = text.split()
    if not words:
        return []
    
    chunks = []
    step = chunk_size_words - overlap_words
    if step <= 0:
        step = max(1, chunk_size_words // 2)
        
    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size_words]
        chunks.append(" ".join(chunk_words))
        if i + chunk_size_words >= len(words):
            break
            
    return chunks
