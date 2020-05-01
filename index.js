function parseStockXLink(url) {
    const regex = /stockx.com\/([a-zA-Z0-9_-]+)/g;
    const test = regex.exec(url);
    if (!test) return null;
    return test[1];
}

async function fetchStockXData(id) {
    const resp = await fetch(`https://stockx.com/api/products/${id}?includes=market&currency=usd`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    });
    const json = await resp.json();
    if (json.title === 'Error' && json.message === 'uuid is not valid') return undefined // handle bad
    if (resp.status === 200 && json.Product) {
        const images = json.Product.media['360'];
        if (!images.length) return 0;
        const edited = images.map(i => `${i.split('?')[0]}?w=1920`);
        return [edited, json.Product.urlKey];
    }
    return null;
}

function makeGif(images, name) {
    const button = document.getElementById('button');
    button.disabled = true;
    button.autocomplete = 'off';

    button.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing... (<span id="percentage">0</span>%)';

    const percentage = document.getElementById('percentage');
    const img = document.getElementById('theImage');
    const content = document.getElementById('content');

    gifshot.createGIF({
        images,
        gifWidth: 1280,
        gifHeight: 720,
        workers: 3,
        progressCallback: (number) => {
            console.log(number);
            percentage.innerText = Math.round(number * 100);
        },
    }, (obj) => {
        if (obj.error) {
            return content.innerHTML += `
				<br>
				<div class="panel error">
					<div class="head"><i class="fas fa-exclamation-circle"></i> An error occurred!</div>
					<div class="body" style="color: #2C2F33;" align="left">
						Code: ${obj.errorCode || 'Unknown Error'}
						<br>
						Message: ${obj.errorMsg || 'An unknown error occurred.'}
					</div>
				</div>
			`;
        }

        console.log(obj.image.substring(0, 30));

        button.innerHTML = '<i class="fas fa-check"></i> GIF Created!';

        const downloadButton = document.createElement('button');
        downloadButton.className = 'dark';
        downloadButton.style.backgroundColor = '#0055cc';
        downloadButton.innerHTML = '<i class="fas fa-download"></i> Download GIF';

        const reloadButton = document.createElement('button');
        reloadButton.className = 'dark';
        reloadButton.style.backgroundColor = '#ff7900';
        reloadButton.innerHTML = '<i class="fas fa-redo"></i> Generate Another';

        content.appendChild(downloadButton);
        content.appendChild(reloadButton);

        downloadButton.onclick = () => {
            const element = document.createElement('a');
            element.setAttribute('href', obj.image);
            element.setAttribute('download', `${name}.gif`);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        }

        reloadButton.onclick = () => document.location.reload(window.location);
    });
}

function alertAndUnlock(message) {
    const button = document.getElementById('button');
    button.disabled = false;
    button.autocomplete = '';

    alert(message);
}

async function start() {
    const button = document.getElementById('button');
    button.disabled = true;
    button.autocomplete = 'off';

    const field = document.getElementById('url');
    const key = parseStockXLink(field.value);
    if (!key) return alertAndUnlock('Invalid StockX product URL!');

    const data = await fetchStockXData(key);
    console.dir(data);
    if (data === 0) return alertAndUnlock('StockX product has no 360º support!');
    if (!data) return alertAndUnlock('StockX product not found!');

    const [imgs, name] = data;
    makeGif(imgs, name);
}
