const dboperations = require("./dboperations");

var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const { request, response } = require("express");
var app = express();
var router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  })
);
app.use("/api/trs", router);

router.use((request, response, next) => {
  //write authen here

  response.setHeader("Access-Control-Allow-Origin", "*"); //หรือใส่แค่เฉพาะ domain ที่ต้องการได้
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Credentials", true);

  // console.log("middleware");
  next();
});

router.route("/health").get((request, response) => {
  // console.log("health check");
  response.json({ status: 200 });
});

router.route("/topicattd").post((request, response) => {
  let attdData = { ...request.body };
  dboperations
    .topicAttd(attdData)
    .then((result) => {
      response.status(201).json(result);
    })
    .catch((err) => {
      console.error(err);
      response.setStatus(500);
    });
});

router
  .route("/topicattddel/:topic_id/:sub_id/:psn_id")
  .delete((request, response) => {
    dboperations
      .topicAttdDel(
        request.params.topic_id,
        request.params.sub_id,
        request.params.psn_id
      )
      .then((result) => {
        response.status(201).json(result);
      })
      .catch((err) => {
        console.error(err);
        response.setStatus(500);
      });
  });

router.route("/gettopiclist").get((request, response) => {
  dboperations
    .getTopicList()
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/getsubtopiclist").get((request, response) => {
  dboperations
    .getSubTopicList()
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/getattd/:psn_id").get((request, response) => {
  dboperations
    .getAttd(request.params.psn_id)
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/getattdpsn").get((request, response) => {
  dboperations
    .getAttdPsn()
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/getexcelreport/:topic_id").get((request, response) => {
  dboperations
    .getExcelReport(request.params.topic_id)
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/getversion").get((request, response) => {
  dboperations
    .getVersion()
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.setStatus(500);
    });
});

var port = process.env.PORT;
app.listen(port);
console.log("TRS API is running at " + port);
