const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const uglify = require("gulp-uglify");
const clean = require("gulp-clean");
const rename = require("gulp-rename");
const open = require("gulp-open");
const connect = require("gulp-connect");
const connectRewrite = require("connect-modrewrite");
const inject = require("gulp-inject");
const cleanCSS = require("gulp-clean-css");
const htmlmin = require("gulp-htmlmin");

// ----- gulp dev start ----- //

gulp.task("clean", function () {
  return gulp
    .src("./dist/", { read: false, allowEmpty: true })
    .pipe(clean({ force: true }));
});

gulp.task("sass", function () {
  return gulp
    .src("src/sass/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("./dist/css"))
    .pipe(connect.reload());
});

gulp.task("js", function () {
  return gulp
    .src("src/js/**/*.js")
    .pipe(uglify())
    .pipe(
      rename(function (path) {
        path.basename += ".min";
        path.extname = ".js";
      })
    )
    .pipe(gulp.dest("./dist/js"))
    .pipe(connect.reload());
});

gulp.task("html", function () {
  return gulp
    .src("src/**/*.html")
    .pipe(
      inject(gulp.src(["./src/partials/*.html"]), {
        starttag: "<!-- inject:{{path}} -->",
        relative: true,
        removeTags: true,
        transform: function (filePath, file) {
          // return file contents as string
          return file.contents.toString("utf8");
        },
      })
    )
    .pipe(gulp.dest("./dist"))
    .pipe(connect.reload());
});

gulp.task("webserver", function () {
  const server = connect.server({
    root: ["dist", "static"],
    host: "0.0.0.0", //host設定'0.0.0.0'，就可以用內網檢視
    port: 3000, //設定一個沒在使用的port
    livereload: true, //auto refresh
    middleware: function () {
      return [connectRewrite(["^.([^\\.]+)$ /$1.html [L]"])];
    },
  });
  return gulp.src("./").pipe(
    open({
      uri: "http://localhost:" + server.port,
    })
  );
});

gulp.task("watch", function () {
  gulp.watch("src/sass/**/*.scss", gulp.series("sass"));
  gulp.watch("src/js/**/*.js", gulp.series("js"));
  gulp.watch("src/**/*.html", gulp.series("html"));
});

gulp.task(
  "default",
  gulp.series(
    "clean",
    "sass",
    "js",
    "html",
    gulp.parallel("webserver", "watch"),
    function (done) {
      done();
    }
  )
);

// ----- gulp dev end ----- //

// ----- gulp deploy start ----- //

gulp.task("deploy-clean", function () {
  return gulp
    .src("./deploy/", { read: false, allowEmpty: true })
    .pipe(clean({ force: true }));
});

gulp.task("deploy-sass", function () {
  return gulp
    .src(["src/sass/**/*.scss", "!src/sass/vars.scss"]) // exclude var.scss fail
    .pipe(sass().on("error", sass.logError))
    .pipe(cleanCSS({}))
    .pipe(gulp.dest("./deploy/css"));
});

gulp.task("deploy-js", function () {
  return gulp
    .src("src/js/**/*.js")
    .pipe(
      uglify({
        compress: {
          drop_console: true,
        },
      })
    )
    .pipe(
      rename(function (path) {
        path.basename += ".min";
        path.extname = ".js";
      })
    )
    .pipe(gulp.dest("./deploy/js"));
});

gulp.task("deploy-html", function () {
  return gulp
    .src("src/**/*.html")
    .pipe(
      inject(gulp.src(["./src/partials/*.html"]), {
        starttag: "<!-- inject:{{path}} -->",
        relative: true,
        removeTags: true,
        transform: function (filePath, file) {
          // return file contents as string
          return file.contents.toString("utf8");
        },
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("./deploy"));
});

gulp.task("deploy-static", function () {
  return gulp.src("./static/**/*").pipe(gulp.dest("./deploy/"));
});

gulp.task(
  "build",
  gulp.series(
    "deploy-clean",
    "deploy-sass",
    "deploy-js",
    "deploy-html",
    "deploy-static"
  )
);

// ----- gulp deploy end ----- //
