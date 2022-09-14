const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
const initiateDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log("DB error ${e.message}");
    process.exit(1);
  }
};

initiateDBAndServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details order by player_id asc`;
  const getPlayersDetails = await db.all(getPlayersQuery);
  const playersObject = getPlayersDetails.map((obj) => {
    return {
      playerId: obj.player_id,
      playerName: obj.player_name,
    };
  });
  response.send(playersObject);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `select * from player_details where player_id = ${playerId}`;
  const getPlayerDetails = await db.get(getPlayerQuery);
  const playerObject = {
    playerId: getPlayerDetails.player_id,
    playerName: getPlayerDetails.player_name,
  };
  response.send(playerObject);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `update player_details set
    player_name = '${playerName}' where player_id = ${playerId}`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `select * from match_details where match_id = ${matchId} order by match_id asc`;
  const matchesDetails = await db.get(getMatchesQuery);
  const matchesObject = {
     matchId: matchesDetails.match_id, match: matchesDetails.match, year: matchesDetails.year 
  };
  response.send(matchesObject);
});
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `select * from match_details as m join player_match_score as pm 
  on m.match_id= pm.match_id where pm.player_id= ${playerId}`;
  const matchesDetails = await db.all(getMatchesQuery);
  const matchesObject = matchesDetails.map((obj) => {
    return { matchId: obj.match_id, match: obj.match, year: obj.year };
  });
  response.send(matchesObject);
});
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `select * from player_details as m join player_match_score as pm 
  on m.player_id= pm.player_id where pm.match_id= ${matchId}`;
  const matchesDetails = await db.all(getMatchesQuery);
  const matchesObject = matchesDetails.map((obj) => {
    return { playerId: obj.player_id, playerName: obj.player_name };
  });
  response.send(matchesObject);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `select pm.player_id as playerId,player_name 
  as playerName,sum(score) as totalScore,sum(fours) as totalFours,sum(sixes) as totalSixes
   from player_match_score as pm join player_details as p on pm.player_id = p.player_id
where pm.player_id = ${playerId} group by pm.player_id`;
  const playerDetails = await db.all(getMatchesQuery);
  response.send(playerDetails);
});

module.exports = app;
