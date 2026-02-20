const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'PROJECT_STRUCTURE.md';
const IGNORE_DIRS = ['node_modules', '.next', '.git', 'public', 'dist'];
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'];

function getProjectTree(dir, prefix = '') {
    let markdown = '';
    const files = fs.readdirSync(dir);

    files.forEach((file, index) => {
        if (IGNORE_DIRS.includes(file)) return;

        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const isLast = index === files.length - 1;
        const connector = isLast ? '└── ' : '├── ';

        if (stats.isDirectory()) {
            markdown += `${prefix}${connector}${file}/\n`;
            markdown += getProjectTree(filePath, prefix + (isLast ? '    ' : '│   '));
        } else {
            markdown += `${prefix}${connector}${file}\n`;
        }
    });
    return markdown;
}

function generateMarkdown() {
    console.log('Generating documentation...');

    let content = '# Project Documentation\n\n';

    content += '## Project Structure\n\n```text\n';
    content += getProjectTree(process.cwd());
    content += '```\n\n';

    content += '## Key File Contents\n\n';
    const importantDirs = ['app', 'components', 'lib'];

    importantDirs.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => TARGET_EXTENSIONS.includes(path.extname(f)));
            files.forEach(file => {
                const fileData = fs.readFileSync(path.join(dirPath, file), 'utf8');
                content += `### ${path.join(dir, file)}\n\n\`\`\`${path.extname(file).slice(1)}\n${fileData}\n\`\`\`\n\n`;
            });
        }
    });

    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`✅ ${OUTPUT_FILE} created successfully.`);
}

generateMarkdown();
