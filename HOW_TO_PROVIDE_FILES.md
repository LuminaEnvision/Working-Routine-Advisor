# How to Provide Your Own Files

## Quick Guide

There are **3 easy ways** to provide your own files (images, documents, etc.) for me to use in your project:

### Method 1: Drag & Drop (Easiest)
1. Simply **drag and drop** your files directly into this chat interface
2. I'll automatically receive them and can use them in your project
3. Works for images, PDFs, text files, and more

### Method 2: Place in Project Directory
1. Put your files in the appropriate project folder:
   - **Images**: `/Users/luminaenvision/Working-Routine-Advisor/public/images/`
   - **Documents**: Anywhere in your project directory
2. Tell me the file path
3. I can access and use them immediately

### Method 3: Upload via Chat
1. Look for the attachment/upload button (📎) in the chat interface
2. Click it and select your files
3. Upload and tell me what you want to do with them

## For Recommendation Images Specifically

### Current Image Files
Your recommendation cards currently use these images:
```
public/images/
├── category_sleep_wide.png          (414 KB)
├── category_nutrition_wide.png      (484 KB)
├── category_activity_wide.png       (612 KB)
├── category_stress_wide.png         (853 KB)
└── category_productivity_wide.png   (650 KB)
```

### To Replace with Your Own Images

**Option A: Drag & Drop**
1. Drag your images into the chat
2. Tell me which category each image is for
3. I'll rename and place them in the correct location

**Option B: Manual Placement**
1. Navigate to: `/Users/luminaenvision/Working-Routine-Advisor/public/images/`
2. Replace the existing files with your own
3. Keep the same filenames OR tell me the new names to update the code

### Image Specifications

For best results, your images should be:
- **Format**: PNG or JPG
- **Aspect Ratio**: 16:9 (wide format, e.g., 1920x1080, 1280x720)
- **Resolution**: At least 1280x720px
- **File Size**: Under 1MB for fast loading
- **Content**: Clear, high-quality, relevant to the category

### Example Categories & Image Ideas

| Category | Good Image Ideas |
|----------|-----------------|
| **Sleep** | Bedroom, bed, moon, stars, peaceful night scene |
| **Nutrition** | Healthy food, fruits, vegetables, balanced meal |
| **Activity** | Exercise, yoga, running, gym, sports |
| **Stress** | Meditation, nature, zen garden, calm water |
| **Productivity** | Workspace, desk, laptop, organized office |

## Adding New Categories

If you want to add a new recommendation category with its own image:

1. **Provide the image** (via drag & drop or upload)
2. **Tell me the category name** (e.g., "Hydration", "Social", "Mindfulness")
3. I'll:
   - Add the image to the project
   - Update the code to recognize the new category
   - Set up the matching logic

## File Organization Tips

### Recommended Structure
```
public/
├── images/
│   ├── category_*.png          # Recommendation category images
│   ├── icons/                  # App icons (if needed)
│   └── backgrounds/            # Background images (if needed)
└── documents/                  # PDFs, guides, etc.
```

### Naming Conventions
- Use lowercase
- Separate words with underscores
- Be descriptive: `category_sleep_wide.png` not `img1.png`
- Include dimensions if relevant: `banner_1920x400.png`

## Common File Types I Can Work With

### Images
- PNG, JPG, JPEG, WebP, SVG
- GIF (for animations)
- ICO (for favicons)

### Documents
- PDF
- TXT, MD (Markdown)
- JSON, YAML
- CSV

### Code
- JS, TS, TSX, JSX
- CSS, SCSS
- HTML

### Other
- Fonts (TTF, WOFF, WOFF2)
- Audio (MP3, WAV)
- Video (MP4, WebM)

## Need Help?

Just ask! Some examples:
- "I have a sleep image, how do I add it?"
- "Can you use this image for the nutrition category?"
- "I want to add a new category called 'Hydration' with this image"
- "How do I replace all the images at once?"

I'm here to help make the process as smooth as possible! 🚀
