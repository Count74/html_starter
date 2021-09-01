const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
//const sourcemaps = require('gulp-sourcemaps');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const fileinclude = require('gulp-file-include');
const concat = require('gulp-concat');
	// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;

		// Подключаем gulp-imagemin для работы с изображениями
const imagemin = require('gulp-imagemin');
 
// Подключаем модуль gulp-newer
const newer = require('gulp-newer');
 
// Подключаем модуль del
const del = require('del');

const pug = require('gulp-pug');


function server() {
  browserSync.init({ // Инициализация Browsersync
		server: { baseDir: 'app/' }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true // Режим работы: true или false
	})
}

function watching() {
  watch('app/**/scss/**/*', styles);
	// watch('app/html/**/*.html', html);
	watch('app/pug/**/*.pug', pughtml);
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
	watch('app/img_src/**/*', images);
  watch(['app/*.html', 'app/css/**/*.css']).on('change', browserSync.reload);
}

function styles() {
  return src('app/scss/main.scss') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
	//.pipe(sourcemaps.init())
	.pipe(scss()) // Преобразуем значение переменной "preprocessor" в функцию
	.pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Создадим префиксы с помощью Autoprefixer
	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Минифицируем стили
	//.pipe(sourcemaps.write())
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
		'app/js/script.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
		])
	.pipe(concat('app.min.js')) // Конкатенируем в один файл
	.pipe(uglify({mangle: {toplevel: true}})) // Сжимаем JavaScript
	.pipe(dest('app/js/')) // Выгружаем готовый файл в папку назначения
	.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
}

function images() {
	return src('app/img_src/**/*') // Берём все изображения из папки источника
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
		'app/fonts/**/*',
		], { base: 'app' }) // Параметр "base" сохраняет структуру проекта при копировании
	.pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
}
 
function cleandist() {
	return del('dist/**/*', { force: true }) // Удаляем всё содержимое папки "dist/"
}

function pughtml() {
	return src('./app/pug/pages/**/*.pug')
		.pipe(pug({
			pretty: true
		}))
		.pipe(dest('./app/'));
}

exports.server = server;
exports.watching = watching;
exports.styles = styles;
exports.html = html;
exports.scripts = scripts;
exports.pughtml = pughtml;
exports.build = series(cleandist, styles, scripts, images, pughtml, buildcopy);
exports.default = parallel(server, watching);