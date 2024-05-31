'use strict'

let dropArea

let columns

let folderRelations

let columnsContainer

let folderOnly

let dontShowNames

let forbiddenFiles = []

let allowedFiles = []

let scaleY

let scaleX

let y, x

const imagesFolder = "file_images"

window.addEventListener('resize', () => {
    scaleX = window.outerWidth / x;
    scaleY = window.outerHeight / y;
    
    [...folderRelations.children].forEach(linea => {


        linea.setAttribute('x1', (linea.x1.baseVal.value) * scaleX)
        linea.setAttribute('x2', (linea.x2.baseVal.value) * scaleX)
        linea.setAttribute('y1', (linea.y1.baseVal.value) * scaleY)
        linea.setAttribute('y2', (linea.y2.baseVal.value) * scaleY)

    });

    x = window.outerWidth
    y = window.outerHeight
})

document.addEventListener('DOMContentLoaded', () => {
    x = window.outerWidth
    y = window.outerHeight
    dropArea = document.getElementById('drop-area')
    columnsContainer = document.querySelector("#folder-structure")
    columns = []
    folderRelations = document.getElementById('relations')

    
    document.querySelector("#background-color").addEventListener('input', (e) => {
        document.querySelector("#main-content").style.background = e.target.value
    })

    document.querySelector("#lines-color").addEventListener('input', (e) => {
        document.querySelector("#relations").style.stroke = e.target.value
    })

    document.querySelector("#text-color").addEventListener('input', (e) => {
        document.querySelector("#main-content").style.color = e.target.value
    })

    document.querySelector("#show-names").addEventListener('change', (e) => {
        dontShowNames = e.currentTarget.checked
    })

    document.querySelector("#folder-only").addEventListener('change', (e) => {
        folderOnly = e.currentTarget.checked
    })

    document.querySelector("#regenerate-button").addEventListener('click', regenerateHtml, false)
    document.querySelector("#download-button").addEventListener('click', downloadPicture, false)

    let events = {
        "dragenter" : dragenter,
        "dragover" : dragover,
        "dragleave" : dragleave,
        "drop" : drop
    }

    for(let eventName in events) {
        dropArea.addEventListener(eventName, events[eventName], false)
    }
  
});

function regenerateHtml() {
    document.querySelector("#interactive-area").style.display = 'block'
    document.querySelector("#final-result").style.display = 'none'
    while(folderRelations.firstChild) {
        folderRelations.removeChild(folderRelations.lastChild)
    }

    while(columnsContainer.firstChild) {
        columnsContainer.removeChild(columnsContainer.lastChild)
    }
    columns = []
}

function downloadPicture() {
    const captureArea = document.getElementById('main-content');
    const originalBoxShadow = captureArea.style.boxShadow;
    const originalBorderRadius = captureArea.style.borderRadius;
    captureArea.style.boxShadow = 'none';
    captureArea.style.borderRadius = 0;
    html2canvas(captureArea).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        download(imgData)
        captureArea.style.boxShadow = originalBoxShadow;
        captureArea.style.borderRadius = originalBorderRadius;
    });

};

function download(url) {
    const a = document.createElement('a')
    a.href = url
    a.download = 'mapped_file_tree.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }


function dragenter(e) {
    preventDefaults(e)
    highlight(e)
}

function dragover(e) {
    preventDefaults(e)
    highlight(e)
}

function dragleave(e) {
    preventDefaults(e)
    unhighlight(e)
}

function drop(e) {
    preventDefaults(e)
    unhighlight(e)
    handleDrop(e)
}


function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

function handleDrop(e) {
    document.querySelector("#interactive-area").style.display = 'none'
    document.querySelector("#final-result").style.display = 'block'

    const files = e.dataTransfer.items;

    if  (document.querySelector("#allowed-files").value) {
        allowedFiles = document.querySelector("#allowed-files").value.replace(/\s/g,'').value.split(',')
    }
    if  (document.querySelector("#forbidden-files").value) {
        forbiddenFiles = document.querySelector("#forbidden-files").value.replace(/\s/g,'').value.split(',')
    }


    handleFiles(files);
}

function handleFiles(files) {

    const filesArray = [...files];

    filesArray.forEach(n => traverseFileTree(n.webkitGetAsEntry()));
}

async function traverseFileTree(item, path, depth, parent, first, last) {
    depth = depth || 0;
    path = path || "";

    let visualElement = createCell(item.name, item.isDirectory);

    addCell(visualElement, depth, parent === undefined ? -1 : [...getColumn(depth -1).children].indexOf(parent));

    if (parent !== undefined) {
        drawLine(parent, visualElement, first);
    }

    if (last) {
        drawLongLine(parent, visualElement)
    }

    if (item.isDirectory) {
        var dirReader = item.createReader();
        const readEntriesPromise = new Promise((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
        });

        try {
            let entries = await readEntriesPromise;

            entries = entries.filter(file => folderOnly ? file.isDirectory :
                                                          !forbiddenFiles.includes(getExtension(item.name) &&
                                                          (allowedFiles.length == 0 || allowedFiles.includes(getExtension(item.name))))
            )

            for (const entry of entries) {
                let position = entries.indexOf(entry)
                await traverseFileTree(entry, path + item.name + "/", depth + 1, visualElement, position == 0, position == entries.length -1);
            }
        } catch (error) {
            console.error(error);
        }
    }
}

function getExtension(name) {
    return name.split(".").slice(-1)
}

function addCell(cell, depth, parentPosition) {
    let column = getColumn(depth)

    let columnPosition = columns.indexOf(column)

    for (let index = column.children.length; index < parentPosition; index++) {
        column.appendChild(createEmtpyCell())
    }

    column.appendChild(cell)

    let cellPosition = column.children.length -1

    for(let i = 0; i < columnPosition; i++) {
        if (columns[i].children.length -1 < cellPosition) {
            columns[i].appendChild(createEmtpyCell())
        }
    }
}


function getColumn(position) {
    while(columns.length -1 < position) {
        let column = document.createElement("div")
        column.classList.add("column")
        columns.push(column)
        columnsContainer.appendChild(column)
    }
    return columns[position]
}

function createEmtpyCell() {
    let cell = document.createElement("div")
    cell.classList.add("cell")
    return cell
}

function createCell(name, folder) {
    name = name || ""
    let cell = createEmtpyCell()

    addImageToCell(cell, name, folder)

    if (!dontShowNames) {
        addTextToCell(cell, name)
    }

    return cell
}

function addImageToCell(cell, name, folder) {
    let icon = document.createElement("img")
    icon.src = getFileIcon(getExtension(name), folder)
    cell.appendChild(icon)
}

function addTextToCell(cell, name) {
    let cellName = document.createElement("p")
    cellName.textContent = name
    cellName.classList.add("cell-text")
    cell.appendChild(cellName)
}

function getFileIcon(extension, folder) {
    if (!extension || folder) {
        return "folder.png"
    }
    let path = `${imagesFolder}/${extension}.png`
    return fileExists(path) ? path : `${imagesFolder}/unknown.png`
}

function getMiddleLeft(element) {
    const rect = getRelativeBoundingClientRect(element)
    return {
        x: rect.left,
        y: rect.y + (rect.height / 2)
    };
}

function getMiddleRight(element) {
    const rect = getRelativeBoundingClientRect(element)
    return {
        x: rect.left + rect.width,
        y: rect.y + (rect.height / 2)
    };
}

function getMiddleRightText(element) {
    const rect = getRelativeBoundingClientRect(element.lastChild);
    return {
        x: rect.left + rect.width,
        y: rect.y + (rect.height / 2)
    };
}

function getRelativeBoundingClientRect(element) {
    const parentPos = document.querySelector("#relations").getBoundingClientRect();
    const childPos = element.getBoundingClientRect();

    const reslativePos = {
        top: childPos.top - parentPos.top,
        right: childPos.right - parentPos.right,
        bottom: childPos.bottom - parentPos.bottom,
        left: childPos.left - parentPos.left,
        x: childPos.left - parentPos.left,
        y: childPos.top - parentPos.top,
        width: childPos.width,
        height: childPos.height,
    };

    return reslativePos
}



function drawLine(l1, l2, first) {
    const start = first ? getMiddleRightText(l1) : getMiddleRight(l1);
    const end = getMiddleLeft(l2);

    var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');

    newLine.setAttribute('x1', start.x);
    newLine.setAttribute('y1', end.y );
    newLine.setAttribute('x2', end.x);
    newLine.setAttribute('y2', end.y);
    
    newLine.classList.add("linea")

    folderRelations.appendChild(newLine)
}

function drawLongLine(parent, lastOne) {
    const start = getMiddleRight(parent);
    const end = getMiddleLeft(lastOne);

    var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
    newLine.setAttribute('x1', start.x);
    newLine.setAttribute('y1', start.y);
    newLine.setAttribute('x2', start.x);
    newLine.setAttribute('y2', end.y);
    
    newLine.classList.add("linea")

    folderRelations.appendChild(newLine)
}

function fileExists(url) {

    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
    
}
  /*
  
  USAR ESTO PARA MEJORAR: (EL CODIGO DE ARRIBA NO PERMITE MAS DE 100 ENTRADAS)

  // Drop handler function to get all files
async function getAllFileEntries(dataTransferItemList) {
  let fileEntries = [];
  // Use BFS to traverse entire directory/file structure
  let queue = [];
  // Unfortunately dataTransferItemList is not iterable i.e. no forEach
  for (let i = 0; i < dataTransferItemList.length; i++) {
    // Note webkitGetAsEntry a non-standard feature and may change
    // Usage is necessary for handling directories
    queue.push(dataTransferItemList[i].webkitGetAsEntry());
  }
  while (queue.length > 0) {
    let entry = queue.shift();
    if (entry.isFile) {
      fileEntries.push(entry);
    } else if (entry.isDirectory) {
      queue.push(...await readAllDirectoryEntries(entry.createReader()));
    }
  }
  return fileEntries;
}

// Get all the entries (files or sub-directories) in a directory 
// by calling readEntries until it returns empty array
async function readAllDirectoryEntries(directoryReader) {
  let entries = [];
  let readEntries = await readEntriesPromise(directoryReader);
  while (readEntries.length > 0) {
    entries.push(...readEntries);
    readEntries = await readEntriesPromise(directoryReader);
  }
  return entries;
}

// Wrap readEntries in a promise to make working with readEntries easier
// readEntries will return only some of the entries in a directory
// e.g. Chrome returns at most 100 entries at a time
async function readEntriesPromise(directoryReader) {
  try {
    return await new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject);
    });
  } catch (err) {
    console.log(err);
  }
}
  */