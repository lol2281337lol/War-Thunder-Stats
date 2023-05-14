// content.js
async function fetchPage(url, account) {
  const response = await fetch(`http://localhost:3000/fetch-data/${account}`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch');
  }

  return response.json();
}


function parseVehicles(htmlArray) {
    const airVehicles = [];
    const landVehicles = [];

    htmlArray.forEach((html, index) => {
        //console.log(`HTML content at index ${index}:`, html);

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const vehicleRows = doc.querySelectorAll('tr[data-role][data-country]');

        console.log(`Parsing HTML array item at index ${index}: found ${vehicleRows.length} vehicle rows`);

        vehicleRows.forEach((row) => {
            const vehicleName = row.querySelector('.vehicle').dataset.sort;
            const vehicleBattles = row.querySelector('.params li:first-child .param_value strong').textContent.trim();
            const vehicleWinRate = row.querySelector('td[data-sort]:nth-child(4)').textContent.trim();

            const vehicleData = {
                name: vehicleName,
                winRate: vehicleWinRate,
                battles: vehicleBattles,
            };

            if (row.dataset.role.includes('bombers all') || row.dataset.role.includes('fighters all')) {
                airVehicles.push(vehicleData);
            } else {
                landVehicles.push(vehicleData);
            }
        });
    });

    return { airVehicles, landVehicles };
}


async function fetchVehicles(htmlArray) {
  const parser = new DOMParser();
  const landPage = parser.parseFromString(htmlArray[0], 'text/html');
  const airPage = parser.parseFromString(htmlArray[1], 'text/html');

  const landVehicles = Array.from(landPage.querySelectorAll('td.vehicle')).map((td) => td.dataset.sort);
  const airVehicles = Array.from(airPage.querySelectorAll('td.vehicle')).map((td) => td.dataset.sort);

  return [...landVehicles, ...airVehicles];
}


async function fetchAndLogVehicles(account) {
    if (!account) {
        console.error('Account name not found');
        return;
    }
    try {
        const data = await fetchPage(null, account);
        const htmlArray = data.data; 
        console.log('Fetched HTML array:', htmlArray);
        const result = await parseVehicles(htmlArray);

        const airVehiclesTable = createTable(result.airVehicles, 'Воздушная техника');
		airVehiclesTable.style.fontSize = '15px';
		const landVehiclesTable = createTable(result.landVehicles, 'Наземная техника');
		landVehiclesTable.style.fontSize = '15px';
const mainInfoContainer = document.querySelector('.marketItemView--mainInfoContainer');
if (mainInfoContainer) {
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = '1fr 1fr';

    // First append the land vehicles, then the air vehicles
    gridContainer.appendChild(landVehiclesTable);
    gridContainer.appendChild(airVehiclesTable);

    mainInfoContainer.appendChild(gridContainer);

    }

} catch (error) {
    console.error('Error fetching vehicles for account', account, error);
}
}


window.addEventListener('load', () => {
    console.log('Load event triggered.');
    const spanElements = Array.from(document.querySelectorAll('span[itemprop="name"]'));
    const isWarThunderPage = spanElements.some((el) => el.textContent.trim() === 'War Thunder' || el.textContent.trim() === 'Вернуться к поиску War Thunder' );
    console.log('Is War Thunder page?', isWarThunderPage);
    if (isWarThunderPage) {
        const accountNameElement = document.querySelector('.marketItemView--counters .counter .label');
        const accountName = accountNameElement ? accountNameElement.textContent.trim() : '';
        fetchAndLogVehicles(accountName);
    }
});


function createTable(dataArray, tableName) {
    // Sort the dataArray by descending 'battles'
    dataArray.sort((a, b) => parseInt(b.battles) - parseInt(a.battles));
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'Name           ';
    const winRateHeader = document.createElement('th');
    winRateHeader.textContent = 'Win Rate     ';
    const battlesHeader = document.createElement('th');
    battlesHeader.textContent = 'Battles';
    headerRow.appendChild(nameHeader);
    headerRow.appendChild(winRateHeader);
    headerRow.appendChild(battlesHeader);
    table.appendChild(headerRow);

    dataArray.forEach((dataItem) => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = dataItem.name;
        const winRateCell = document.createElement('td');
        winRateCell.textContent = dataItem.winRate;
        const battlesCell = document.createElement('td');
        battlesCell.textContent = dataItem.battles;
        row.appendChild(nameCell);
        row.appendChild(winRateCell);
        row.appendChild(battlesCell);
        table.appendChild(row);
    });

    const tableContainer = document.createElement('div');
    const tableNameElement = document.createElement('h2');
    tableNameElement.textContent = tableName;
    tableContainer.appendChild(tableNameElement);
    tableContainer.appendChild(table);

    tableContainer.style.marginBottom = '5px';
    tableContainer.style.whiteSpace = 'nowrap';
    tableContainer.style.display = 'inline-block';
    tableContainer.style.margin = '0 25px 15px 0';
    tableContainer.style.width = '26%';
    tableContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, \'Open Sans\', HelveticaNeue, sans-serif';

    return tableContainer;
}
