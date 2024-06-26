document.addEventListener("DOMContentLoaded", function () {

  // Define the APIs as constants (use to fetch data)
  const routeAPI =
    "https://rt.data.gov.hk/v2/transport/nlb/route.php?action=list";
  const routeStopAPI =
    "https://rt.data.gov.hk/v2/transport/nlb/stop.php?action=list&routeId=";
  const timeAPI =
    "https://rt.data.gov.hk/v2/transport/nlb/stop.php?action=estimatedArrivals&routeId={routeId}&stopId={stopId}&language={languageCode}";

  // Select DOM elements from the HTML document
  const submitBtn = document.querySelector("#button");
  const busNumber = document.querySelector("#busNumber");
  const dataContainer = document.querySelector("#dataContainer");

  //Add a click event listener to the submit button
  submitForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent form submission and page reload
    getData();
  });

  //Call the function when the submit button is clicked
  function getData() {
    const userInput = busNumber.value;

    // Check if the user input is empty
    if (userInput === "") {
      // Clear previous data if the user input is empty
      dataContainer.innerHTML = "";

      // Display a message asking for input
      const messageElement = document.createElement("p");
      messageElement.textContent = "請輸入巴士號碼";
      messageElement.style.color = "red";
      messageElement.style.textAlign = "center";
      messageElement.style.fontSize = "16px";
      dataContainer.appendChild(messageElement);

      // Exit the function
      return;
    }

    // Clear user input
    busNumber.value = "";

    fetchData(userInput);
  }

  async function fetchData(userInput) {
    // Clear previous data
    dataContainer.innerHTML = "";

    // Show loading message
    const loadingElement = document.createElement("p");
    loadingElement.id = "loadingMessage";
    loadingElement.textContent = "加載中...";
    loadingElement.style.textAlign = "center";
    loadingElement.style.fontSize = "16px";
    dataContainer.appendChild(loadingElement);

    try {
      const res = await fetch(routeAPI);
      const result = await res.json();

      // Check if a matching route exists
      let routeExists = false; // Flag to check if a matching route exists

      if (result && result.routes && result.routes.length > 0) {
        for (const route of result.routes) {
          if (route.routeNo.toLowerCase() === userInput.toLowerCase()) {
            createRouteButton(route, route.routeNo);
            routeExists = true; // Set flag to true if a matching route is found
          }
        }

        // Clear loading message
        const loadingMessage = document.getElementById("loadingMessage");

        if (loadingMessage) {
          loadingMessage.style.display = "none";
        }

        // Check if no matching route was found
        if (!routeExists) {
          // Display error message for non-existent route number
          dataContainer.innerHTML = "沒有此巴士路線";
          dataContainer.style.color = "red";
          dataContainer.style.textAlign = "center";
          dataContainer.style.fontSize = "16px";
        }
      }

      /*// Clear loading message
        const loadingMessage = document.getElementById("loadingMessage");
        if (loadingMessage) {
          loadingMessage.style.display = "none";
        }*/
    } catch (error) {
      console.error("Error fetching route data:", error);
      dataContainer.innerHTML = "Error fetching data.";
    }
  }

  // Create a button for a specific route and append it to the dataContainer
  function createRouteButton(route, userInput) {
    // Check if the message is already present
    if (!document.getElementById("directionMessage")) {
      // Add the message above the selected route button
      const message = document.createElement("p");
      message.id = "directionMessage";
      message.textContent = "選擇方向：";
      message.style.textAlign = "center";
      message.style.fontSize = "18px";
      dataContainer.appendChild(message);
    }

    const busNumberBtn = `button_${route.routeId}`;
    const buttonElement = document.createElement("button");
    buttonElement.id = busNumberBtn;
    buttonElement.innerText = `${userInput} ${route.routeName_c}`;

    // Add a click event listener to the button
    // Call the function when the button is clicked
    buttonElement.addEventListener("click", () => {
      // Clear the message when the button is clicked
      const message = document.getElementById("directionMessage");
      if (message) {
        message.remove();
      }
      showRouteStop(route.routeId);
    });

    dataContainer.appendChild(buttonElement);
  }

  // Function is called when the button is clicked
  async function showRouteStop(routeId) {
    const selectedRouteButton = document.getElementById(`button_${routeId}`);

    // Clear previous data
    dataContainer.innerHTML = "";

    // Append the selected route button back to the container
    dataContainer.appendChild(selectedRouteButton);

    // Show loading Gif
    const loadingElement = document.createElement("p");
    loadingElement.id = "loadingMessage";
    dataContainer.appendChild(loadingElement);
    const gifURL =
      "https://cdn.dribbble.com/users/1698559/screenshots/3790348/___.gif";
    const gifElement = document.createElement("img");
    gifElement.src = gifURL;
    gifElement.style.width = "100%";
    gifElement.style.height = "70%";
    loadingElement.appendChild(gifElement);

    async function fetchRouteStopData(routeId) {
      const res = await fetch(routeStopAPI + routeId);
      const result = await res.json();

      if (result && result.stops) {
        return result.stops;
      } else {
        console.log("Route stop data not found.");
        return [];
      }
    }

  // Function to create a table row for a bus stop
  function createTableRow(stop, arrivalTimes, index) {
    const row = document.createElement("tr");

    const sequenceCell = document.createElement("td");
    sequenceCell.textContent = `${index + 1}`;
    row.appendChild(sequenceCell);

    const nameCell = document.createElement("td");
    nameCell.textContent = stop.stopName_c;
    row.appendChild(nameCell);

    const timeCell = document.createElement("td");

    if (arrivalTimes && arrivalTimes.length > 0) {
      arrivalTimes.forEach((time) => {
        const formattedTime = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeRow = document.createElement("div");
        timeRow.textContent = formattedTime;
        timeCell.appendChild(timeRow);
      });
    } else {
      timeCell.textContent = "暫無班次途經本站";
    }

    row.appendChild(timeCell);

    const mapButtonCell = document.createElement("td");
    const mapButton = document.createElement("mapBtn");
    mapButton.textContent = "顯示";
    mapButton.dataset.latitude = stop.latitude;
    mapButton.dataset.longitude = stop.longitude;
    mapButton.addEventListener("click", function () {
      toggleMap(mapButton);
    });
    mapButtonCell.appendChild(mapButton);
    row.appendChild(mapButtonCell);

    return row;
  }

  // Function to toggle the map's visibility
  function toggleMap(mapButton) {
    const latitude = mapButton.dataset.latitude;
    const longitude = mapButton.dataset.longitude;
    const row = mapButton.parentNode.parentNode;

    if (!row.nextSibling || !row.nextSibling.classList.contains("map-row")) {
      const mapRow = document.createElement("tr");
      mapRow.className = "map-row";
      const mapCell = document.createElement("td");
      mapCell.colSpan = "4"; // Span across all columns

      const mapIframe = document.createElement("iframe");
      mapIframe.src = `https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3691.2652607348364!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjLCsDE4JzIwLjkiTiAxMTTCsDEwJzA1LjUiRQ!5e0!3m2!1sen!2shk!4v1702883238467!5m2!1sen!2shk`;
      mapIframe.loading = "lazy";

      mapCell.appendChild(mapIframe);
      mapRow.appendChild(mapCell);

      // Insert the map row between the current row and the next row
      row.parentNode.insertBefore(mapRow, row.nextSibling);
      mapButton.textContent = "隱藏";
    } else {
      const mapRow = row.nextSibling;
      mapRow.remove();
      mapButton.textContent = "顯示";
    }
  }


    // Display the table with stop names and arrival times
    // Table header
    try {
      const stops = await fetchRouteStopData(routeId);
      const table = document.createElement("table");
      const headerRow = document.createElement("tr");

      const numberHeader = document.createElement("th");
      numberHeader.textContent = "編號";
      numberHeader.style.width = "18%";
      headerRow.appendChild(numberHeader);

      const nameHeader = document.createElement("th");
      nameHeader.textContent = "車站";
      nameHeader.style.width = "30%";
      headerRow.appendChild(nameHeader);

      const timeHeader = document.createElement("th");
      timeHeader.textContent = "預計抵站時間";
      timeHeader.style.width = "30%";
      headerRow.appendChild(timeHeader);

      const mapHeader = document.createElement("th");
      mapHeader.textContent = "地圖";
      mapHeader.style.width = "25%";
      headerRow.appendChild(mapHeader);

      table.appendChild(headerRow);

      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const arrivalTimes = await fetchArrivalTimeData(routeId, stop.stopId);
        const row = createTableRow(stop, arrivalTimes, i);
        table.appendChild(row);
      }

      // Clear loading message
      const loadingMessage = document.getElementById("loadingMessage");
      if (loadingMessage) {
        loadingMessage.style.display = "none";
      }
      dataContainer.appendChild(table);

      // Display an error message if there are any errors during the fetching process
    } catch (error) {
      console.error("Error fetching route stop data:", error);
      dataContainer.innerHTML = "Error fetching data.";
    }
  }

  // Fetch route stop data
  async function fetchRouteStopData(routeId) {
    const response = await fetch(routeStopAPI + routeId);
    const data = await response.json();
    return data.data;
  }

  // Fetching the estimate arrival time data
  // routeId and stopId (an array of stopIds) as parameters
  async function fetchArrivalTimeData(routeId, stopId) {
    const res = await fetch(
      timeAPI
        .replace("{routeId}", routeId)
        .replace("{stopId}", stopId)
        .replace("{languageCode}", "en")
    );
    const result = await res.json();

    if (
      result &&
      result.estimatedArrivals &&
      result.estimatedArrivals.length > 0
    ) {
      const estimatedArrivals = result.estimatedArrivals;
      const arrivalTimes = estimatedArrivals.map(
        (arrival) => arrival.estimatedArrivalTime
      );

      return arrivalTimes;
    } //else {
    //console.log("Arrival time data not found.");
    //console.log("API Response:", result);
    //return [];
  }

  // Add refresh button
  document.getElementById("refreshBtn").addEventListener("click", function () {
    // Reload the page using location.reload()
    location.reload();
  });

  // Create a button for showing all routes
  const showAllRoutesButton = document.querySelector("#showAllRoutesBtn");
  //showAllRoutesButton.innerText = "顯示全部路線";

  showAllRoutesButton.addEventListener("click", showAllRoutes);

  //Create a function to show all routes
  async function showAllRoutes() {
    // Clear previous data
    dataContainer.innerHTML = "";

    try {
      // Fetch all routes
      const res = await fetch(routeAPI);
      const result = await res.json();
      const routes = result.routes;

      // Create a button for each route and append it to the dataContainer
      routes.forEach((route) => {
        const busNumberBtn = `button_${route.routeId}`;
        const buttonElement = document.createElement("button");
        buttonElement.id = busNumberBtn;
        buttonElement.innerText = `${route.routeNo} ${route.routeName_c}`;

        // Add a click event listener to the button
        // Call the function when the button is clicked
        buttonElement.addEventListener("click", () => {
          showRouteStop(route.routeId);
        });

        dataContainer.appendChild(buttonElement);
      });
    } catch (error) {
      console.error("Error fetching routes:", error);
      dataContainer.innerHTML = "Error fetching routes.";
    }
  }

  dataContainer.appendChild(showAllRoutesButton);
});
