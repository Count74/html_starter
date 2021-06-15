const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const fileinclude = require('gulp-file-include');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const del = require('del');

function server() {
  browserSync.init({ // Инициализация Browsersync
		server: { baseDir: 'app/' }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true // Режим работы: true или false
	})
}

function watching() {
  watch('app/**/scss/**/*', styles);
	watch('app/html/**/*.html', html);
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
	watch('app/img/**/*', images);
  watch(['app/*.html', 'app/css/**/*.css']).on('change', browserSync.reload);
}

function styles() {
  return src('app/scss/main.scss') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
	.pipe(sourcemaps.init())
	.pipe(scss()) // Преобразуем значение переменной "preprocessor" в функцию
	.pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Создадим префиксы с помощью Autoprefixer
	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Минифицируем стили
	// .pipe(sourcemaps.write())
	.pipe(dest('app/css/')) // Выгрузим результат в папку "app/css/"
	.pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}

// сборка html
function html() {
	return src('./app/html/*.html')
		.pipe(fileinclude({ prefix: '@@' }))
		.pipe(dest('./app/'));
}

function scripts() {
	return src([ // Берём файлы из источников
		//'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
		// 'node_modules/bootstrap/js/dist/carousel.js',
		// 'app/js/script.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
		])
	.pipe(concat('app.min.js')) // Конкатенируем в один файл
	.pipe(uglify({mangle: {toplevel: true}})) // Сжимаем JavaScript
	.pipe(dest('app/js/')) // Выгружаем готовый файл в папку назначения
	.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
}

function images() {
	return src('app/img/**/*') // Берём все изображения из папки источника
	.pipe(newer('app/images/')) // Проверяем, было ли изменено (сжато) изображение ранее
	.pipe(imagemin()) // Сжимаем и оптимизируем изображеня
	.pipe(dest('app/images/')) // Выгружаем оптимизированные изображения в папку назначения
}
 
function cleanimg() {
	return del('app/images/**/*', { force: true }) // Удаляем всё содержимое папки "app/images/dest/"
}
 
function buildcopy() {
	return src([ // Выбираем нужные файлы
		'app/css/**/*.min.css',
		'app/js/**/*.min.js',
		'app/images/**/*',
		'app/*.html',
		], { base: 'app' }) // Параметр "base" сохраняет структуру проекта при копировании
	.pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
}
 
function cleandist() {
	return del('dist/**/*', { force: true }) // Удаляем всё содержимое папки "dist/"
}

exports.server = server;
exports.watching = watching;
exports.styles = styles;
exports.html = html;
exports.scripts = scripts;
exports.build = series(cleandist, styles, scripts, images, html, buildcopy);
exports.default = parallel(server, watching);