const { readFile } = require('fs/promises');
const { existsSync, createReadStream } = require('fs');
const readline = require('readline');

async function main() {
    let filesList = await retrieveFileNames();
    filesList = removeNonExistingFiles(filesList); // To remove non-existing filepaths from the array.
    let results = [];
    for (let path of filesList) {
        let wordCount = new Promise((resolve, reject) => {
            let wordsCounter = 0;
            const readStream = createReadStream(path, { encoding: 'utf8' }); // creating a stream to read the file using it.
            const rl = readline.createInterface({
                input: readStream,
                crlfDelay: Infinity,
            });
            rl.on('line', (line) => {
                if (/^\s*$/.test(line))
                    // to detect lines that doesn't contain words at all.
                    return;
                let splitted = line
                    .trim()
                    .replace(/(\t+|\r+|\n+|\r\n)/g, ' ')
                    .split(/\s+/g);
                wordsCounter += splitted.length;
            }); // action to peform when recieving a line from the stream.
            rl.on('close', () => {
                resolve(wordsCounter); // resolve the promise when we finish reading the file from the stream.
            });
        });
        results.push(wordCount); // pushing the promise into an array of promises to resolve using Promise.all()
    }
    Promise.all(results).then((arr) => {
        for (let index in arr) {
            if (arr[index] === 0) {
                console.log(`'${filesList[index]}': 0 words (Empty file)`);
                continue;
            }
            console.log(
                `'${filesList[index]}': ${arr[index]} ${arr[index] > 1 ? 'words' : 'word'}`
            );
        }
    });
}

async function retrieveFileNames() {
    try {
        const file = await readFile('./config.json', 'utf-8');
        const list = JSON.parse(file);
        return list.files;
    } catch (error) {
        console.error(`Something went wrong: ${error.message}`);
    }
}

function removeNonExistingFiles(filesList) {
    let newList = [];
    for (let filePath of filesList) {
        if (!existsSync(filePath)) {
            console.error(`Failed to fetch file : ${filePath} doesn't exist.`);
            continue;
        }
        newList.push(filePath);
    }
    return newList;
}

main(); // Script entry point.
