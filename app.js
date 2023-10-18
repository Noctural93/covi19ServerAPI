const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(8080, () => {
      console.log("Server is Running at http://localhost:8080/");
    });
  } catch (error) {
    console.log(`Db error ${error.message}`);
    process.exit(1);
  }
};

initializeDbToServer();

const convertStateObjToResponsiveObj = (dbObject) => {
  return {
    state_id: dbObject.stateId,
    state_name: dbObject.stateName,
    population: dbObject.population,
  };
};

const convertDistrictObjToResponsiveObj = (dbObject) => {
  return {
    district_id: dbObject.districtId,
    district_name: dbObject.districtName,
    state_id: dbObject.stateId,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// Get
app.get("/states/", async (request, response) => {
  const reqQuery = `
    SELECT 
        *
    FROM 
        state
    ORDER BY
        state_id;`;
  const dbResponse = await db.all(reqQuery);
  response.send(
    dbResponse.map((eachState) => convertStateObjToResponsiveObj(eachState))
  );
});
