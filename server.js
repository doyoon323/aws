const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const port = 3000;

// -----------------------------------------------------
// PostgreSQL Pool (Kubernetes 공용 DB)
// -----------------------------------------------------
const pool = new Pool({
  host: "postgres",  // K8s Service 이름
  user: "dyn",
  password: "",      // 반드시 나중에 Secret으로 교체
  database: "webapp",
  port: 5432,
});

// DB 연결 테스트
pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("❌ PostgreSQL 연결 실패:", err));

// -----------------------------------------------------
// Middleware
// -----------------------------------------------------
app.use(express.json());

// "/" 라우터가 먼저 실행되도록 static은 뒤로 보냄
app.get("/", (req, res) => {
  console.log("GET / 요청 들어옴");

  const filePath = path.join(__dirname, "assets/week2.html");
  console.log("시도하는 파일 경로:", filePath);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("❌ sendFile error:", err);
      return res.status(500).send("파일 로드 실패: " + err.message);
    }
    console.log("sendFile 성공");
  });
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, "assets")));

// -----------------------------------------------------
// API Endpoints
// -----------------------------------------------------

// 회원가입 (SQL injection 방지)
app.post("/api/signup", async (req, res) => {
  const { username, password, email } = req.body;

  try {
    await pool.query(
      "INSERT INTO users (username, password, email) VALUES ($1, $2, $3)",
      [username, password, email]
    );
    res.send("회원가입 성공");
  } catch (err) {
    console.error("❌ 회원가입 실패:", err);
    res.status(400).send("회원가입 실패");
  }
});

// 로그인
app.post("/api/loginup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM users WHERE username=$1 AND password=$2",
      [username, password]
    );

    const count = Number(result.rows[0].count);

    if (count > 0) res.send("로그인 성공");
    else res.send("로그인 실패");

  } catch (err) {
    console.error("❌ 로그인 오류:", err);
    res.status(500).send("로그인 오류");
  }
});

// 유저 목록 조회
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT username, email FROM users"
    );

    res.send(`
      <h1>사용자 목록</h1>
      <pre>${JSON.stringify(result.rows, null, 2)}</pre>
    `);

  } catch (err) {
    console.error("❌ 사용자 조회 오류:", err);
    res.status(500).send("사용자 조회 실패");
  }
});

// 테스트 API
app.get("/api/os", async (req, res) => {
  try {
    const result = await pool.query("SELECT username, email FROM users");

    res.send(`
      <html>
      <body>
        <h1>테스트 OS 출력</h1>
        <pre>${JSON.stringify(result.rows, null, 2)}</pre>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("❌ /api/os 오류:", err);
    res.status(500).send("OS 조회 실패");
  }
});

// -----------------------------------------------------
// 서버 시작
// -----------------------------------------------------
app.listen(port, () => {
  console.log("server is running now");
});