require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
var config = require("./dbconfig");
const sql = require("mssql");
const dateFns = require("date-fns");

async function getAllPSNData() {
  console.log("let getAllPSNData");
  const result = await fetch(
    `http://${process.env.backendHost}:${process.env.himsPort}/api/himspsn/getallpsn`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("getAllPSNData complete");
      return data;
    })
    .catch((error) => {
      if (error.name === "AbortError") {
        console.log("cancelled");
      } else {
        console.error("Error:", error);
      }
    });
  return result;
}

async function attdInc(topic_id, sub_id) {
  let pool = await sql.connect(config);
  let result = await pool
    .request()
    .input("topic_id", sql.VarChar, topic_id)
    .input("sub_id", sql.VarChar, sub_id)
    .query(
      "SELECT attd FROM trs_topic_sub WHERE topic_id = @topic_id AND id = @sub_id"
    );
  result = result.recordset[0];
  await pool
    .request()
    .input("topic_id", sql.VarChar, topic_id)
    .input("sub_id", sql.VarChar, sub_id)
    .input("attd", sql.Int, parseInt(result.attd ?? 0) + 1)
    .query(
      "UPDATE trs_topic_sub SET attd = @attd WHERE topic_id = @topic_id AND id = @sub_id"
    );
}

async function topicAttd(attdData) {
  try {
    console.log("topicAttd call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    await pool
      .request()
      .input("topic_id", sql.VarChar, attdData.topic_id)
      .input("sub_id", sql.VarChar, attdData.sub_id)
      .input("psn_id", sql.VarChar, attdData.psn_id)
      .query(
        "INSERT INTO trs_attd_list (topic_id, sub_id, psn_id)" +
          " VALUES (@topic_id, @sub_id, @psn_id)"
      );
    await attdInc(attdData.topic_id, attdData.sub_id);

    console.log("topicAttd complete");
    console.log("====================");
    return { status: "ok" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function attdDec(topic_id, sub_id) {
  let pool = await sql.connect(config);
  let result = await pool
    .request()
    .input("topic_id", sql.VarChar, topic_id)
    .input("sub_id", sql.VarChar, sub_id)
    .query(
      "SELECT attd FROM trs_topic_sub WHERE topic_id = @topic_id AND id = @sub_id"
    );
  console.log(result);
  result = result.recordset[0];
  await pool
    .request()
    .input("topic_id", sql.VarChar, topic_id)
    .input("sub_id", sql.VarChar, sub_id)
    .input("attd", sql.Int, parseInt(result.attd) - 1)
    .query(
      "UPDATE trs_topic_sub SET attd = @attd WHERE topic_id = @topic_id AND id = @sub_id"
    );
}

async function topicAttdDel(topic_id, sub_id, psn_id) {
  try {
    console.log("topicAttdDel call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    await pool
      .request()
      .input("topic_id", sql.VarChar, topic_id)
      .input("psn_id", sql.VarChar, psn_id)
      .query(
        "DELETE FROM trs_attd_list WHERE topic_id = @topic_id AND psn_id = @psn_id"
      );
    await attdDec(topic_id, sub_id);

    console.log("topicAttdDel complete");
    console.log("====================");
    return { status: "ok" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getTopicList() {
  try {
    console.log("getTopicList call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const result = await pool
      .request()
      .query(
        "SELECT * FROM trs_topic WHERE isactive = 1 AND GETDATE() > start_sdate AND GETDATE() < end_sdate ORDER BY id DESC"
      );
    console.log("getTopicList complete");
    console.log("====================");
    return result.recordsets[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getAllTopicList() {
  try {
    console.log("getAllTopicList call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const result = await pool
      .request()
      .query("SELECT * FROM trs_topic ORDER BY id DESC");
    console.log("getAllTopicList complete");
    console.log("====================");
    return result.recordsets[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getSubTopicList() {
  try {
    console.log("getSubTopicList call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const result = await pool
      .request()
      .query(
        "SELECT trs_topic_sub.*" +
          ", trs_topic_sub.id AS sub_id" +
          ", trs_topic.name AS topic_name" +
          ", trs_topic.isactive AS topic_isactive" +
          " FROM trs_topic_sub" +
          " LEFT JOIN trs_topic ON trs_topic.id = trs_topic_sub.topic_id" +
          " WHERE trs_topic_sub.isactive = 1"
      );
    console.log("getSubTopicList complete");
    console.log("====================");
    return result.recordsets[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getAllSubTopicList() {
  try {
    console.log("getSubTopicList call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const result = await pool
      .request()
      .query(
        "SELECT trs_topic_sub.*" +
          ", trs_topic_sub.id AS sub_id" +
          ", trs_topic.name AS topic_name" +
          ", trs_topic.isactive AS topic_isactive" +
          " FROM trs_topic_sub" +
          " LEFT JOIN trs_topic ON trs_topic.id = trs_topic_sub.topic_id"
      );
    console.log("getSubTopicList complete");
    console.log("====================");
    return result.recordsets[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getAttd(psn_id) {
  try {
    console.log("attdChk call by " + psn_id + " try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    let result = await pool
      .request()
      .input("psn_id", sql.VarChar, psn_id)
      .query(
        "SELECT trs_topic_sub.topic_id" +
          ", trs_topic_sub.id AS sub_id" +
          ", trs_topic_sub.name" +
          ", trs_topic_sub.attd" +
          ", trs_topic_sub.lmt" +
          ", trs_topic_sub.start_date" +
          ", trs_topic_sub.end_date" +
          ", trs_attd_list.psn_id" +
          ", trs_topic.name AS topic_name" +
          ", trs_topic.isactive" +
          " FROM trs_attd_list" +
          " LEFT JOIN trs_topic_sub ON trs_topic_sub.id = trs_attd_list.sub_id" +
          " AND trs_topic_sub.topic_id = trs_attd_list.topic_id" +
          " LEFT JOIN trs_topic ON trs_topic.id = trs_attd_list.topic_id" +
          " WHERE trs_attd_list.psn_id = @psn_id" +
          " ORDER BY trs_topic_sub.topic_id DESC"
      );
    console.log("attdChk complete");
    console.log("====================");
    return result.recordsets[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getAttdPsn() {
  try {
    console.log("getAttdPsnList call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const psnList = await getAllPSNData();
    let result = await pool
      .request()
      .query(
        "SELECT trs_topic_sub.*" +
          ", trs_topic_sub.id AS sub_id" +
          ", trs_topic_sub.name AS sub_name" +
          ", trs_attd_list.psn_id" +
          ", trs_topic.name AS topic_name" +
          ", trs_topic.isactive" +
          " FROM trs_attd_list" +
          " LEFT JOIN trs_topic_sub ON trs_topic_sub.id = trs_attd_list.sub_id" +
          " AND trs_topic_sub.topic_id = trs_attd_list.topic_id" +
          " LEFT JOIN trs_topic ON trs_topic.id = trs_attd_list.topic_id"
      );
    result = await result.recordsets[0];

    for (let i = 0; i < result.length; i += 1) {
      for (let n = 0; n < psnList.length; n += 1) {
        if (result[i].psn_id === psnList[n].psn_id) {
          await Object.assign(result[i], {
            psn_name: `${psnList[n].pname}${psnList[n].fname} ${psnList[n].lname}`,
            pos_name: psnList[n].pos_name,
            dept_name: psnList[n].dept_name,
            fac_name: psnList[n].fac_name,
            fld_name: psnList[n].fld_name,
          });
        }
      }
    }
    console.log("getAttdPsnList complete");
    console.log("====================");
    return result;
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getAttdPsnByTopic(topic_id) {
  try {
    console.log("getAttdPsnByTopic call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const psnList = await getAllPSNData();
    let result = await pool
      .request()
      .input("topic_id", sql.VarChar, topic_id)
      .query(
        "SELECT trs_topic_sub.*" +
          ", trs_topic_sub.id AS sub_id" +
          ", trs_topic_sub.name AS sub_name" +
          ", trs_attd_list.psn_id" +
          ", trs_topic.name AS topic_name" +
          ", trs_topic.isactive" +
          " FROM trs_attd_list" +
          " LEFT JOIN trs_topic_sub ON trs_topic_sub.id = trs_attd_list.sub_id" +
          " AND trs_topic_sub.topic_id = trs_attd_list.topic_id" +
          " LEFT JOIN trs_topic ON trs_topic.id = trs_attd_list.topic_id" +
          " WHERE trs_attd_list.topic_id = @topic_id"
      );
    result = await result.recordsets[0];

    for (let i = 0; i < result.length; i += 1) {
      for (let n = 0; n < psnList.length; n += 1) {
        if (result[i].psn_id === psnList[n].psn_id) {
          await Object.assign(result[i], {
            psn_name: `${psnList[n].pname}${psnList[n].fname} ${psnList[n].lname}`,
            pos_name: psnList[n].pos_name,
            dept_name: psnList[n].dept_name,
            fac_name: psnList[n].fac_name,
            fld_name: psnList[n].fld_name,
          });
        }
      }
    }
    console.log("getAttdPsnByTopic complete");
    console.log("====================");
    return result;
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getExcelReport(topic_id) {
  try {
    console.log("getExcelReport call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    let result = await pool
      .request()
      .input("topic_id", sql.VarChar, topic_id)
      .query(
        "SELECT" +
          " trs_topic.id" +
          ", MAX(trs_topic.name) AS topic_name" +
          ", COUNT(trs_topic_sub.id) AS sub_amt" +
          " FROM trs_topic" +
          " LEFT JOIN trs_topic_sub ON" +
          " trs_topic_sub.topic_id = trs_topic.id" +
          " WHERE trs_topic.id = @topic_id" +
          " GROUP BY trs_topic.id"
      );
    console.log("getExcelReport complete");
    console.log("====================");
    return result.recordset[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function voteCheck(id) {
  try {
    console.log("voteCheck call try connect to server");
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("id", sql.VarChar, id)
      .query("SELECT *" + " FROM trs_popular_vote_temp" + " WHERE id = @id");
    console.log("voteCheck complete");
    console.log("====================");
    return result.recordset[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function vote(data) {
  try {
    console.log("vote call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    let result = await pool
      .request()
      .input("id", sql.VarChar, data.id)
      .input("vote", sql.VarChar, data.vote)
      .query(
        "INSERT INTO trs_popular_vote_temp (id, vote)" + " VALUES (@id, @vote)"
      );
    console.log("vote complete");
    console.log("====================");
    return { status: "ok" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function addTopic(data, topicId, img) {
  try {
    console.log("addTopic call, try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");

    await pool
      .request()
      .input("id", sql.VarChar, topicId)
      .input("name", sql.VarChar, data.name)
      .input("start_sdate", sql.SmallDateTime, data.start_sdate)
      .input("end_sdate", sql.SmallDateTime, data.end_sdate)
      .input("img", sql.Bit, parseInt(img))
      .input("remark", sql.VarChar, data.remark)
      .input("create_by", sql.VarChar, data.create_by)
      .query(
        "INSERT INTO trs_topic" +
          " (id, name, isactive, start_sdate, end_sdate, img, remark, create_by, create_date, last_edit_by, last_edit_date)" +
          " VALUES (@id, @name, 1, @start_sdate, @end_sdate, @img, @remark, @create_by, GETDATE(), '', '')"
      );

    console.log("addTopic complete");
    console.log("====================");
    return { status: "ok", message: "เพิ่มข้อมูลลงระบบเรียบร้อยแล้ว" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function updateTopic(data, img) {
  try {
    console.log("updateTopic id : " + data.id + " call, try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    await pool
      .request()
      .input("id", sql.VarChar, data.id)
      .input("name", sql.VarChar, data.name)
      .input("start_sdate", sql.SmallDateTime, data.start_sdate)
      .input("end_sdate", sql.SmallDateTime, data.end_sdate)
      .input("img", sql.Bit, img ? 1 : 0)
      .input("isactive", sql.Bit, parseInt(data.isactive))
      .input("remark", sql.VarChar, data.remark)
      .input("last_edit_by", sql.VarChar, data.last_edit_by)
      .query(
        "UPDATE trs_topic" +
          " SET name = @name" +
          ", start_sdate = @start_sdate" +
          ", end_sdate = @end_sdate" +
          ", img = @img" +
          ", isactive = @isactive" +
          ", remark = @remark" +
          ", last_edit_by = @last_edit_by" +
          ", last_edit_date = GETDATE()" +
          " WHERE id = @id"
      );

    console.log("updateTopic complete");
    console.log("====================");
    return { status: "ok", message: "อัพเดทข้อมูลในระบบเรียบร้อยแล้ว" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function genNewSubTopicId(topic_id) {
  console.log("generate new sub id");
  let pool = await sql.connect(config);
  const lastId = await pool
    .request()
    .input("topic_id", sql.VarChar, topic_id)
    .query(
      "SELECT TOP (1) id FROM trs_topic_sub WHERE topic_id = @topic_id ORDER BY id DESC"
    );
  if (lastId.recordset.length !== 0) {
    const newId = lastId.recordset[0].id.slice(1);
    return `S${String(parseInt(newId) + 1).padStart(2, "0")}`;
  } else {
    return "S01";
  }
}

async function addSubTopic(data) {
  try {
    console.log(data);
    console.log("addSubTopic call, try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const id = await genNewSubTopicId(data.topic_id);
    await pool
      .request()
      .input("topic_id", sql.VarChar, data.topic_id)
      .input("id", sql.VarChar, id)
      .input("name", sql.VarChar, data.name)
      .input("lmt", sql.Int, data.lmt)
      .input("start_date", sql.SmallDateTime, data.start_date)
      .input("end_date", sql.SmallDateTime, data.end_date)
      .input("remark", sql.VarChar, data.remark)
      .input("create_by", sql.VarChar, data.create_by)
      .query(
        "INSERT INTO trs_topic_sub" +
          " (topic_id, id, name, attd, lmt, start_date, end_date, isactive, remark, create_by, create_date, last_edit_by, last_edit_date)" +
          " VALUES (@topic_id, @id, @name, 0, @lmt, @start_date, @end_date, 1, @remark, @create_by, GETDATE(), '', '')"
      );

    console.log("addSubTopic complete");
    console.log("====================");
    return { status: "ok", message: "เพิ่มข้อมูลลงระบบเรียบร้อยแล้ว" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function updateSubTopic(data) {
  try {
    console.log(
      "updateSubTopic topic_id : " +
        data.topic_id +
        " id : " +
        data.id +
        " call, try connect to server"
    );
    let pool = await sql.connect(config);
    console.log("connect complete");
    await pool
      .request()
      .input("topic_id", sql.VarChar, data.topic_id)
      .input("id", sql.VarChar, data.id)
      .input("name", sql.VarChar, data.name)
      .input("start_date", sql.SmallDateTime, data.start_date)
      .input("end_date", sql.SmallDateTime, data.end_date)
      .input("isactive", sql.Bit, parseInt(data.isactive))
      .input("last_edit_by", sql.VarChar, data.last_edit_by)
      .query(
        "UPDATE trs_topic_sub" +
          " SET name = @name" +
          ", start_date = @start_date" +
          ", end_date = @end_date" +
          ", isactive = @isactive" +
          ", last_edit_by = @last_edit_by" +
          ", last_edit_date = GETDATE()" +
          " WHERE topic_id = @topic_id AND id = @id"
      );

    console.log("updateSubTopic complete");
    console.log("====================");
    return { status: "ok", message: "อัพเดทข้อมูลในระบบเรียบร้อยแล้ว" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getVersion() {
  try {
    return process.env.version;
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

module.exports = {
  topicAttd: topicAttd,
  topicAttdDel: topicAttdDel,
  getTopicList: getTopicList,
  getAllTopicList: getAllTopicList,
  getSubTopicList: getSubTopicList,
  getAllSubTopicList: getAllSubTopicList,
  getAttd: getAttd,
  getAttdPsn: getAttdPsn,
  getAttdPsnByTopic: getAttdPsnByTopic,
  getExcelReport: getExcelReport,
  voteCheck: voteCheck,
  vote: vote,
  addTopic: addTopic,
  updateTopic: updateTopic,
  addSubTopic: addSubTopic,
  updateSubTopic: updateSubTopic,
  getVersion: getVersion,
};
