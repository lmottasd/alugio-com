# ALUGIO Website - Project Guidelines

## Project Status
✅ **Converted from Framer to Native HTML**
- Removed all Framer/React dependencies (2026-03-25)
- Now using clean semantic HTML with embedded CSS/JS
- Single Landing.html file with language toggle
- Original Framer backup: `Landing.html.framer-original.backup`

## Language Management
The site supports **Portuguese (PT)** and **English (EN)** with a toggle in the header.

### Editing Content
1. All text content uses `data-lang-pt` and `data-lang-en` attributes
2. To add/modify content:
   ```html
   <element data-lang-pt="Portuguese text" data-lang-en="English text">Portuguese text</element>
   ```
3. The JavaScript language switcher automatically handles translations
4. User preference is saved in browser (localStorage)

### Adding New Sections
- Use semantic HTML (`<section>`, `<article>`, `<h2>`, etc.)
- Follow the pattern: `<element data-lang-pt="PT" data-lang-en="EN">PT</element>`
- Add any CSS to the `<style>` block
- Test both language modes before deploying

## Technical Stack
- **HTML**: Semantic, no frameworks
- **CSS**: Embedded in `<style>` tag, responsive grid/flexbox layout
- **JavaScript**: Simple language toggle with localStorage
- **Assets**: Can add images to `Landing_files/` folder and reference in HTML

## No External Dependencies
✅ No npm/package.json needed
✅ No build process required
✅ Edit and save, works immediately
✅ Open in any browser
