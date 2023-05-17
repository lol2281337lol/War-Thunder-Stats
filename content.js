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

function parseVehicles(htmlArray, vehiclesData) {
  let gjnSum = 0;
  let zoSum = 0;
  const airVehicles = [];
  const landVehicles = [];
  const premiumVehicles = []; // новый массив

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
		  const fileVehicle = vehiclesData.find(v => v.name === vehicleName);
  if (fileVehicle) {
    vehicleData.fileData = fileVehicle;
    switch (fileVehicle.currency) {
      case 'З.О':
        vehicleData.color = '#008000';
        premiumVehicles.push(vehicleData); // добавляем в премиумные
        zoSum += Number(fileVehicle.price); // Переместил строку сюда
        break;
      case 'GJN':
        vehicleData.color = 'rgb(200, 22, 193)';
        premiumVehicles.push(vehicleData); // добавляем в премиумные
        gjnSum += Number(fileVehicle.price); // Переместил строку сюда
        break;
      case 'Пакетная/Акционная':
        vehicleData.color = '#ee2727';
        premiumVehicles.push(vehicleData); // добавляем в премиумные
        break;
      case 'Наградная':
        vehicleData.color = '#42aaff';
        premiumVehicles.push(vehicleData); // добавляем в премиумные
        break;
    }
  }

            if (row.dataset.role.includes('bombers all') || row.dataset.role.includes('fighters all')) {
                airVehicles.push(vehicleData);
            } else {
                landVehicles.push(vehicleData);
            }
        });
    });

      return { airVehicles, landVehicles, premiumVehicles, gjnSum, zoSum };
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
        const vehiclesData = data.vehiclesData;

        console.log('Fetched HTML array:', htmlArray);

        const result = await parseVehicles(htmlArray, vehiclesData);

        const airVehiclesTable = createTable(result.airVehicles, 'Air Vehicles');
		airVehiclesTable.style.fontSize = '15px';
        const landVehiclesTable = createTable(result.landVehicles, 'Land Vehicles');
		landVehiclesTable.style.fontSize = '15px';
        const premiumVehiclesTable = createTable(result.premiumVehicles, 'Premium Vehicles');

        const airVehiclesBattles = result.airVehicles.reduce((sum, vehicle) => sum + parseInt(vehicle.battles), 0);
        const landVehiclesBattles = result.landVehicles.reduce((sum, vehicle) => sum + parseInt(vehicle.battles), 0);
        const totalBattles = airVehiclesBattles + landVehiclesBattles;

        const airVehiclesPercentage = ((airVehiclesBattles / totalBattles) * 100).toFixed(2);
        const landVehiclesPercentage = ((landVehiclesBattles / totalBattles) * 100).toFixed(2);

        const tabStructure = createTabStructure(
            ['Воздушная техника', 'Наземная техника', 'Премиумная техника'],
            [airVehiclesTable, landVehiclesTable, premiumVehiclesTable],
            [result.airVehicles.length, result.landVehicles.length, result.premiumVehicles.length], // количество техники
            [airVehiclesBattles, landVehiclesBattles, 0], // общее количество боёв
            [airVehiclesPercentage, landVehiclesPercentage, 0] // процентное соотношение боёв
        );

        const mainInfoContainer = document.querySelector('.marketItemView--mainInfoContainer');
        if (mainInfoContainer) {
            const gjnCounter = createCounterElement(result.gjnSum, 'GJN');
            const zoCounter = createCounterElement(result.zoSum, 'З.О');

            mainInfoContainer.appendChild(gjnCounter);
            mainInfoContainer.appendChild(zoCounter);
            mainInfoContainer.appendChild(tabStructure);
        }

    } catch (error) {
        console.error('Error fetching vehicles for account', account, error);
    }
}


function createCounterElement(value, label) {
    const element = document.createElement('div');
    element.style.marginTop = '10px';
    element.style.marginBottom = '10px';

    const valueElement = document.createElement('span');
    valueElement.textContent = value;
    valueElement.style.fontSize = '19px';

    const labelElement = document.createElement('span');
    labelElement.textContent = ` ${label}`;
    labelElement.style.fontSize = '14px';

    element.appendChild(valueElement);
    element.appendChild(labelElement);

    return element;
}



function createTabStructure(tabLabels, tabContents, tabCounts, battlesCounts, battlesPercentages) {
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('tabsContainer');

    const tabsList = document.createElement('ul');
    tabsList.classList.add('tabsList');

    const tabContentContainer = document.createElement('ul');
    tabContentContainer.classList.add('tabContentContainer');

    tabLabels.forEach((label, index) => {
        const tabListItem = document.createElement('li');
        const tabContentItem = document.createElement('li');  // create the content item

        // add the corresponding content to the content item
        tabContentItem.appendChild(tabContents[index]);

        if (index < 2) { // если это воздушная или наземная техника
            tabListItem.textContent = `${label} (${tabCounts[index]}) (${battlesCounts[index]} битв) (${battlesPercentages[index]}%)`;
        } else { // если это премиумная техника
            tabListItem.textContent = `${label} (${tabCounts[index]})`;
        }

        tabListItem.addEventListener('click', () => {
            document.querySelectorAll('.tabsList li').forEach(li => li.classList.remove('active'));
            tabListItem.classList.add('active');

            document.querySelectorAll('.tabContentContainer li').forEach(li => li.style.display = 'none');
            tabContentItem.style.display = 'block';
        });

        tabsList.appendChild(tabListItem);
        tabContentContainer.appendChild(tabContentItem); // add the content item to the container
    });

    tabsContainer.appendChild(tabsList);
    tabsContainer.appendChild(tabContentContainer);

    return tabsContainer;
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
    battlesHeader.textContent = 'Battles           ';
	const currencyHeader = document.createElement('th'); // новый столбец
	currencyHeader.textContent = 'Валюта           ';
	const priceHeader = document.createElement('th'); // новый столбец
	priceHeader.textContent = 'Цена           ';
	
    headerRow.appendChild(nameHeader);
    headerRow.appendChild(winRateHeader);
    headerRow.appendChild(battlesHeader);
	headerRow.appendChild(currencyHeader); // добавляем новый столбец
	headerRow.appendChild(priceHeader); // добавляем новый столбец
    table.appendChild(headerRow);

dataArray.forEach((dataItem) => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = dataItem.name;
    const winRateCell = document.createElement('td');
    winRateCell.textContent = dataItem.winRate;
    const battlesCell = document.createElement('td');
    battlesCell.textContent = dataItem.battles;

    // Добавляем новые ячейки
    const currencyCell = document.createElement('td'); 
    const priceCell = document.createElement('td'); 

    // Если у данных техники есть информация о файле
    if (dataItem.fileData) {
        currencyCell.textContent = dataItem.fileData.currency;
        priceCell.textContent = dataItem.fileData.price;
    }

    row.appendChild(nameCell);
    row.appendChild(winRateCell);
    row.appendChild(battlesCell);
    row.appendChild(currencyCell); // добавляем новую ячейку в строку
    row.appendChild(priceCell); // добавляем новую ячейку в строку

    // Применяем цвет, если он существует
    if (dataItem.color) {
        //row.style.backgroundColor = dataItem.color;
		row.style.color = dataItem.color;
        row.title = `${dataItem.fileData.name} ; ${dataItem.fileData.price} ; ${dataItem.fileData.currency}`;
    }

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
