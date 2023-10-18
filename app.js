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
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictObjToResponsiveObj = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
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
        state;`;
  const dbResponse = await db.all(reqQuery);
  response.send(
    dbResponse.map((eachState) => convertStateObjToResponsiveObj(eachState))
  );
});

//Get method for a particular data
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const reqQuery = `
    SELECT
        *
    FROM
        state
    WHERE
        state_id = ${stateId};`;
  const dbResponse = await db.get(reqQuery);
  response.send(convertStateObjToResponsiveObj(dbResponse));
});

// Post Method

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const reqQuery = `
    INSERT INTO
        district (district_name, state_id, cases, cured, active, deaths)
    VALUES (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths});`;
  const dbResponse = await db.run(reqQuery);
  const distId = dbResponse.lastId;
  //response.send({districtId: distId});
  response.send("District Successfully Added");
});

// Get Method
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const reqQuery = `
    SELECT
        *
    FROM
        district
    WHERE
        district_id = ${districtId};`;
  const dbResponse = await db.get(reqQuery);
  response.send(convertDistrictObjToResponsiveObj(dbResponse));
});

// Delete Method
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const reqQuery = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId};`;
  await db.run(reqQuery);
  response.send("District Removed");
});

// Put Method
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const reqQuery = `
    UPDATE
        district
    SET 
        district_id = ${districtId},
        district_name = '${districtName}', 
        state_id = ${stateId},
        cases = ${cases}, 
        cured = ${cured}, 
        active = ${active}, 
        deaths = ${deaths}
    WHERE
        district_id = ${districtId};`;
  await db.run(reqQuery);
  response.send("District Details Updated");
});

// Get Method - statistics
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const reqQuery = `
    SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM
        district
    WHERE
        state_id = ${stateId};`;
  const stats = await db.get(reqQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//GEt Method
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const reqStateIdQuery = `
    SELECT
        state_id
    FROM
        district
    WHERE
        district_id = ${districtId};`;
  const dbStateId = await db.get(reqStateIdQuery);
  console.log(dbStateId);
  const reqStateNameQuery = `
    SELECT
        state_name as stateName
    FROM
        state
    WHERE
        state_id = ${dbStateId.state_id};`;
  const dbStateName = await db.get(reqStateNameQuery);
  response.send(dbStateName);
});
module.exports = app;
