const dboperations = require("./dboperations");

const fs = require("fs");
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const multer = require("multer");
const mkdirp = require("mkdirp");
const sharp = require("sharp");
const path = require("path");
const { v4: uuid } = require("uuid");
const { request, response } = require("express");
var app = express();
var router = express.Router();

var config = require("./dbconfig");
const sql = require("mssql");

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

let topicId = "";

const UPLOAD_PATH = path.join(process.env.imgPath, "/TRS");
mkdirp.sync(path.join(process.env.imgPath, "/TRS"));

const storage = multer.diskStorage({
  destination: (req, file, done) => {
    done(null, UPLOAD_PATH);
  },
  filename: (req, file, done) => {
    done(null, uuid() + "___" + file.originalname);
  },
});

const limits = {
  fileSize: 5 * 1024 * 1024,
};

const fileFilter = (request, file, done) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    done(null, true);
  } else {
    done(new Error("file type not supported"), false);
  }
};

const upload = multer({ storage, limits, fileFilter }).single("image");

async function imgUpload(file, id) {
  console.log("Image check");
  if (!file) {
    console.log("No image found to upload");
  } else {
    const newFilePath = path.join(UPLOAD_PATH, id + ".jpg");
    // save newFilePath in your db as image path
    await sharp(file.path).resize().jpeg({ quality: 50 }).toFile(newFilePath);
    fs.unlinkSync(file.path);

    console.log("Image upload complete");
  }
}

async function genNewTopicId() {
  console.log("generate new id");
  let pool = await sql.connect(config);
  const lastId = await pool
    .request()
    .query("SELECT TOP (1) id FROM trs_topic ORDER BY id DESC");
  if (lastId.recordset.length !== 0) {
    const newId = lastId.recordset[0].id.slice(3);
    return `TRS${String(parseInt(newId) + 1).padStart(6, "0")}`;
  } else {
    return "TRS000001";
  }
}

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

router.route("/getalltopiclist").get((request, response) => {
  dboperations
    .getAllTopicList()
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

router.route("/getallsubtopiclist").get((request, response) => {
  dboperations
    .getAllSubTopicList()
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

router.route("/getattdbytopic/:topic_id").get((request, response) => {
  dboperations
    .getAttdPsnByTopic(request.params.topic_id)
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

router.route("/getimg/:id").get((request, response) => {
  try {
    const readStream = fs.createReadStream(
      `${process.env.imgPath}/TRS/${request.params.id}.jpg`
    );
    readStream.on("error", function (err) {
      console.error(err);
      response.json({ status: "error", message: "No image found" });
    });
    readStream.pipe(response);
  } catch (error) {
    console.error(error);
    response.sendStatus(500);
  }
});

router.route("/votecheck/:id").get((request, response) => {
  dboperations
    .voteCheck(request.params.id)
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/vote").post((request, response) => {
  let data = { ...request.body };
  dboperations
    .vote(data)
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/addtopic").post(async (request, response) => {
  topicId = await genNewTopicId();
  console.log("new topic id = " + topicId);
  upload(request, response, async (err) => {
    if (err) {
      return response
        .status(400)
        .json({ success: false, message: err.message });
    }
    try {
      let img = 0;
      const data = request.body;
      const { file } = request;
      if (file) {
        img = 1;
        await imgUpload(file, topicId);
      }
      dboperations
        .addTopic(data, topicId, img)
        .then((result) => {
          response.json(result);
        })
        .catch((err) => {
          console.error(err);
          response.sendStatus(500);
        });
    } catch (error) {
      return response
        .status(500)
        .json({ success: false, message: error.message });
    }
  });
});

router.route("/updatetopic").post(async (request, response) => {
  upload(request, response, async (err) => {
    if (err) {
      return response
        .status(400)
        .json({ success: false, message: err.message });
    }
    try {
      const data = request.body;
      const { file } = request;
      let img = data.img;
      if (file) {
        img = 1;
        await imgUpload(file, data.id);
      }
      dboperations
        .updateTopic(data, img)
        .then((result) => {
          response.json(result);
        })
        .catch((err) => {
          console.error(err);
          response.sendStatus(500);
        });
    } catch (error) {
      return response
        .status(500)
        .json({ success: false, message: error.message });
    }
  });
});

router.route("/addsubtopic").post((request, response) => {
  let data = { ...request.body };
  dboperations
    .addSubTopic(data)
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/updatesubtopic").post((request, response) => {
  let data = { ...request.body };
  dboperations
    .updateSubTopic(data)
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
