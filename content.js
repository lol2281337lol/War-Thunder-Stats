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
  const vehicles = [];

  htmlArray.forEach((html, index) => {
    console.log(`HTML content at index ${index}:`, html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const vehicleRows = doc.querySelectorAll('.vehicle_row');

    console.log(`Parsing HTML array item at index ${index}: found ${vehicleRows.length} vehicle rows`);

    vehicleRows.forEach((row) => {
      const vehicleName = row.querySelector('.vehicle').dataset.sort;
      const vehicleWinRate = row.querySelector('.vehicle_row_wins').textContent.trim();
      const vehicleBattles = row.querySelector('.vehicle_row_battles').textContent.trim();

      vehicles.push({
        name: vehicleName,
        winRate: vehicleWinRate,
        battles: vehicleBattles,
      });
    });
  });

  return vehicles;
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

    // Выводим содержимое htmlArray перед вызовом функции fetchVehicles
    console.log('Fetched HTML array:', htmlArray);

    const result = await fetchVehicles(htmlArray);
    console.log('Vehicles for account', account, result);
  } catch (error) {
    console.error('Error fetching vehicles for account', account, error);
  }
}






function createLoadingAnimation() {
  const loadingElement = document.createElement('div');
  loadingElement.style.fontSize = '19px';
  loadingElement.style.marginBottom = '5px';
  loadingElement.style.whiteSpace = 'nowrap';
  loadingElement.style.textOverflow = 'ellipsis';
  loadingElement.style.fontWeight = 'normal';

  let dots = '.';
  loadingElement.textContent = 'Загрузка' + dots;

  const updateDots = () => {
    dots = dots.length < 3 ? dots + '.' : '.';
    loadingElement.textContent = 'Загрузка' + dots;
  };

  setInterval(updateDots, 500);
  return loadingElement;
}

window.addEventListener('load', () => {
  console.log('Load event triggered.');

  const spanElements = Array.from(document.querySelectorAll('span[itemprop="name"]'));
  const isWarThunderPage = spanElements.some((el) =>
    el.textContent.trim() === 'War Thunder' ||
    el.textContent.trim() === 'Вернуться к поиску War Thunder'
  );

  console.log('Is War Thunder page?', isWarThunderPage);

  if (isWarThunderPage) {
    const accountNameElement = document.querySelector('.marketItemView--counters .counter .label');
    const accountName = accountNameElement ? accountNameElement.textContent.trim() : '';

    fetchAndLogVehicles(accountName);

    if (accountName) {
      const mainInfoContainer = document.querySelector('.marketItemView--mainInfoContainer');

      console.log('Main info container found?', !!mainInfoContainer);

      if (mainInfoContainer) {
        const labels = ['Премиумов за З.О.', 'Премиумов за GJN', 'Пакетные/акционные премиумы'];
        labels.forEach((label) => {
          const counter = document.createElement('div');
          counter.classList.add('counter');

          const labelText = createLoadingAnimation();

          const labelMuted = document.createElement('div');
          labelMuted.classList.add('muted');
          labelMuted.textContent = label;

          counter.appendChild(labelText);
          counter.appendChild(labelMuted);
          mainInfoContainer.appendChild(counter);

          console.log('Added new element:', label);
        });
      }
    }
  }
});
