import fs from "fs";
import path from "path";
import { pool, createDatabase } from "../config/database";

const runMigration = async () => {
  try {
    console.log("🔄 데이터베이스 마이그레이션을 시작합니다...");

    // 데이터베이스 생성
    const dbCreated = await createDatabase();
    if (!dbCreated) {
      throw new Error("데이터베이스 생성에 실패했습니다");
    }

    // 스키마 파일 읽기
    const schemaPath = path.join(__dirname, "../../database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // SQL 문장들을 분리 (세미콜론으로 구분)
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    // CREATE TABLE 문장들을 먼저 실행
    const createTableStatements = statements.filter((stmt) =>
      stmt.toUpperCase().startsWith("CREATE TABLE")
    );

    // 인덱스 생성 문장들을 나중에 실행
    const indexStatements = statements.filter((stmt) =>
      stmt.toUpperCase().startsWith("CREATE INDEX")
    );

    // 테이블 생성
    for (const statement of createTableStatements) {
      if (statement.trim()) {
        try {
          await pool.execute(statement);
          console.log(
            "✅ 테이블 생성 완료:",
            statement.substring(0, 50) + "..."
          );
        } catch (error: any) {
          if (error.code === "ER_TABLE_EXISTS_ERROR") {
            console.log(
              "⚠️ 테이블이 이미 존재합니다:",
              statement.substring(0, 50) + "..."
            );
          } else {
            throw error;
          }
        }
      }
    }

    // 인덱스 생성 (team_projects 인덱스는 나중에 생성)
    for (const statement of indexStatements) {
      if (statement.trim()) {
        // team_projects 인덱스는 나중에 생성하므로 건너뜀
        if (statement.includes("idx_team_projects")) {
          continue;
        }
        try {
          await pool.execute(statement);
          console.log(
            "✅ 인덱스 생성 완료:",
            statement.substring(0, 50) + "..."
          );
        } catch (error: any) {
          if (error.code === "ER_DUP_KEYNAME") {
            console.log(
              "⚠️ 인덱스가 이미 존재합니다:",
              statement.substring(0, 50) + "..."
            );
          } else {
            throw error;
          }
        }
      }
    }

    // 팀-공모전 매핑 테이블 생성 (없으면 생성)
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS team_contests (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          team_id VARCHAR(36) NOT NULL,
          contest_id VARCHAR(36) NOT NULL,
          role VARCHAR(100) NULL,
          note TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_team_contest (team_id, contest_id),
          INDEX idx_team_contests_team_id (team_id),
          INDEX idx_team_contests_contest_id (contest_id)
        )
      `);
      console.log("✅ team_contests 테이블 생성/확인 완료");
    } catch (error) {
      console.error("team_contests 테이블 생성 실패", error);
      throw error;
    }

    // 기존 테이블에 github_url 컬럼 추가 (이미 존재하면 무시)
    try {
      await pool.execute(
        "ALTER TABLE users ADD COLUMN github_url VARCHAR(500)"
      );
      console.log("✅ github_url 컬럼 추가 완료");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️ github_url 컬럼이 이미 존재합니다");
      } else {
        throw error;
      }
    }

    // 기존 테이블에 figma_url 컬럼 추가 (이미 존재하면 무시)
    try {
      await pool.execute("ALTER TABLE users ADD COLUMN figma_url VARCHAR(500)");
      console.log("✅ figma_url 컬럼 추가 완료");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️ figma_url 컬럼이 이미 존재합니다");
      } else {
        throw error;
      }
    }

    // teams 테이블에 collaboration_tools 컬럼 추가 (이미 존재하면 무시)
    try {
      await pool.execute(
        "ALTER TABLE teams ADD COLUMN collaboration_tools TEXT COMMENT '협업 툴 (콤마 구분)'"
      );
      console.log("✅ collaboration_tools 컬럼 추가 완료");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️ collaboration_tools 컬럼이 이미 존재합니다");
      } else {
        throw error;
      }
    }

    // users 테이블에 available_time 컬럼 추가 (이미 존재하면 무시)
    try {
      await pool.execute(
        "ALTER TABLE users ADD COLUMN available_time VARCHAR(255) COMMENT '일주일 내 가용 시간'"
      );
      console.log("✅ users.available_time 컬럼 추가 완료");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️ users.available_time 컬럼이 이미 존재합니다");
      } else {
        throw error;
      }
    }

    // awards 테이블에 새 필드 추가 (이미 존재하면 무시)
    const awardFields = [
      { name: "rank", sql: "VARCHAR(100)", needsBacktick: true },
      { name: "participation_type", sql: "VARCHAR(100)", needsBacktick: false },
      { name: "roles", sql: "TEXT", needsBacktick: false },
      { name: "result_link", sql: "VARCHAR(500)", needsBacktick: false },
      { name: "result_images", sql: "TEXT", needsBacktick: false },
    ];

    for (const field of awardFields) {
      try {
        const columnName = field.needsBacktick
          ? `\`${field.name}\``
          : field.name;
        await pool.execute(
          `ALTER TABLE awards ADD COLUMN ${columnName} ${field.sql}`
        );
        console.log(`✅ awards.${field.name} 컬럼 추가 완료`);
      } catch (error: any) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`⚠️ awards.${field.name} 컬럼이 이미 존재합니다`);
        } else {
          throw error;
        }
      }
    }

    // portfolios 테이블 생성 (없으면 생성)
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS portfolios (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          user_id VARCHAR(36) NOT NULL,
          project_name VARCHAR(255) NOT NULL,
          start_date DATE,
          end_date DATE,
          is_ongoing BOOLEAN DEFAULT FALSE,
          participation_type VARCHAR(100),
          roles TEXT,
          contribution_detail TEXT,
          goal TEXT,
          problem_definition TEXT,
          result_summary TEXT,
          tech_stack TEXT,
          images TEXT,
          github_link VARCHAR(500),
          figma_link VARCHAR(500),
          other_links TEXT,
          certifications TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log("✅ portfolios 테이블 생성/확인 완료");

      // portfolios 테이블 인덱스 생성 (테이블 생성 후)
      try {
        await pool.execute(
          "CREATE INDEX idx_portfolios_user_id ON portfolios(user_id)"
        );
        console.log("✅ portfolios 인덱스 생성/확인 완료");
      } catch (indexError: any) {
        if (indexError.code === "ER_DUP_KEYNAME") {
          console.log("⚠️ portfolios 인덱스가 이미 존재합니다");
        } else {
          console.error("portfolios 인덱스 생성 실패", indexError);
        }
      }
    } catch (error: any) {
      if (
        error.code === "ER_TABLE_EXISTS_ERROR" ||
        error.code === "ER_TABLE_EXISTS"
      ) {
        console.log("⚠️ portfolios 테이블이 이미 존재합니다");

        // 테이블이 이미 있으면 인덱스만 확인
        try {
          await pool.execute(
            "CREATE INDEX idx_portfolios_user_id ON portfolios(user_id)"
          );
          console.log("✅ portfolios 인덱스 생성/확인 완료");
        } catch (indexError: any) {
          if (indexError.code === "ER_DUP_KEYNAME") {
            console.log("⚠️ portfolios 인덱스가 이미 존재합니다");
          } else {
            console.error("portfolios 인덱스 생성 실패", indexError);
          }
        }
      } else {
        console.error("portfolios 테이블 생성 실패", error);
        throw error;
      }
    }

    // teams 테이블에 새 필드 추가 (이미 존재하면 무시)
    const teamFields = [
      {
        name: "area_keywords",
        sql: "TEXT COMMENT '분야 키워드 (JSON 배열 또는 콤마 구분)'",
        needsBacktick: false,
      },
      {
        name: "progress_stage",
        sql: "VARCHAR(100) COMMENT '진행 단계'",
        needsBacktick: false,
      },
      {
        name: "meeting_schedule",
        sql: "TEXT COMMENT '회의 주기 및 방식'",
        needsBacktick: false,
      },
      {
        name: "available_time_slots",
        sql: "TEXT COMMENT '팀 활동 가능 시간대 (JSON 배열 또는 콤마 구분)'",
        needsBacktick: false,
      },
    ];

    for (const field of teamFields) {
      try {
        const columnName = field.needsBacktick
          ? `\`${field.name}\``
          : field.name;
        await pool.execute(
          `ALTER TABLE teams ADD COLUMN ${columnName} ${field.sql}`
        );
        console.log(`✅ teams.${field.name} 컬럼 추가 완료`);
      } catch (error: any) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`⚠️ teams.${field.name} 컬럼이 이미 존재합니다`);
        } else {
          throw error;
        }
      }
    }

    // team_projects 테이블 생성 (없으면 생성)
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS team_projects (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          team_id VARCHAR(36) NOT NULL,
          project_name VARCHAR(255) NOT NULL,
          start_date DATE,
          end_date DATE,
          is_ongoing BOOLEAN DEFAULT FALSE,
          summary TEXT,
          tech_stack TEXT,
          result_link VARCHAR(500),
          performance_indicators TEXT,
          images TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        )
      `);
      console.log("✅ team_projects 테이블 생성/확인 완료");

      // team_projects 인덱스 생성
      try {
        await pool.execute(
          "CREATE INDEX idx_team_projects_team_id ON team_projects(team_id)"
        );
        console.log("✅ team_projects 인덱스 생성/확인 완료");
      } catch (indexError: any) {
        if (indexError.code === "ER_DUP_KEYNAME") {
          console.log("⚠️ team_projects 인덱스가 이미 존재합니다");
        } else {
          console.error("team_projects 인덱스 생성 실패", indexError);
        }
      }
    } catch (error: any) {
      if (
        error.code === "ER_TABLE_EXISTS_ERROR" ||
        error.code === "ER_TABLE_EXISTS"
      ) {
        console.log("⚠️ team_projects 테이블이 이미 존재합니다");

        // 테이블이 이미 있으면 인덱스만 확인
        try {
          await pool.execute(
            "CREATE INDEX idx_team_projects_team_id ON team_projects(team_id)"
          );
          console.log("✅ team_projects 인덱스 생성/확인 완료");
        } catch (indexError: any) {
          if (indexError.code === "ER_DUP_KEYNAME") {
            console.log("⚠️ team_projects 인덱스가 이미 존재합니다");
          } else {
            console.error("team_projects 인덱스 생성 실패", indexError);
          }
        }
      } else {
        console.error("team_projects 테이블 생성 실패", error);
        throw error;
      }
    }

    console.log("🎉 데이터베이스 마이그레이션이 완료되었습니다!");
  } catch (error) {
    console.error("❌ 마이그레이션 중 오류 발생:", error);
    throw error;
  } finally {
    await pool.end();
  }
};

// 스크립트로 직접 실행된 경우
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log("마이그레이션 완료");
      process.exit(0);
    })
    .catch((error) => {
      console.error("마이그레이션 실패:", error);
      process.exit(1);
    });
}

export default runMigration;
