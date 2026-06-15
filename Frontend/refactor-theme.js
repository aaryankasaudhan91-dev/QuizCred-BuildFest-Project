import fs from 'fs';
import path from 'path';

const targetDirs = [
    'd:\\Project 1(Mealer)\\Perfect version\\MK2',
    'd:\\Project 1(Mealer)\\Perfect version\\MK2\\components'
];

const classReplacements = [
    { regex: /(?<!dark:|from-background)bg-slate-950(\/[0-9]+)?\b/g, replacement: (m, op) => `bg-slate-50${op||''} dark:bg-slate-950${op||''}` },
    { regex: /(?<!dark:)bg-slate-900(\/[0-9]+)?\b/g, replacement: (m, op) => `bg-white${op||''} dark:bg-slate-900${op||''}` },
    { regex: /(?<!dark:)bg-slate-800(\/[0-9]+)?\b/g, replacement: (m, op) => `bg-slate-100${op||''} dark:bg-slate-800${op||''}` },
    { regex: /(?<!dark:)text-white\b/g, replacement: () => `text-slate-900 dark:text-white` },
    { regex: /(?<!dark:)text-slate-300\b/g, replacement: () => `text-slate-600 dark:text-slate-300` },
    { regex: /(?<!dark:)text-slate-400\b/g, replacement: () => `text-slate-500 dark:text-slate-400` },
    { regex: /(?<!dark:)border-slate-800(\/[0-9]+)?\b/g, replacement: (m, op) => `border-slate-200${op||''} dark:border-slate-800${op||''}` },
    { regex: /(?<!dark:)border-slate-700(\/[0-9]+)?\b/g, replacement: (m, op) => `border-slate-200${op||''} dark:border-slate-700${op||''}` },
    { regex: /(?<!dark:)border-white\/10\b/g, replacement: () => `border-slate-200 dark:border-white/10` },
    { regex: /(?<!dark:)border-white\/20\b/g, replacement: () => `border-slate-300 dark:border-white/20` },
    { regex: /(?<!dark:)from-slate-900(\/[0-9]+)?\b/g, replacement: (m, op) => `from-slate-50${op||''} dark:from-slate-900${op||''}` },
    { regex: /(?<!dark:)via-slate-950(\/[0-9]+)?\b/g, replacement: (m, op) => `via-white${op||''} dark:via-slate-950${op||''}` },
    { regex: /(?<!dark:)to-black(\/[0-9]+)?\b/g, replacement: (m, op) => `to-slate-100${op||''} dark:to-black${op||''}` },
];

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    for (let rule of classReplacements) {
        content = content.replace(rule.regex, rule.replacement);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${path.basename(filePath)}`);
    }
}

targetDirs.forEach(dir => {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isFile()) {
                processFile(fullPath);
            }
        });
    } catch (e) {
        console.error(`Error reading ${dir}: ${e.message}`);
    }
});
console.log('Script execution completed.');
