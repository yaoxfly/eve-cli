#!/usr/bin/env node
const fs = require('fs') //文件读取模块
const path = require('path')//文件路径
const program = require('commander') //指令模块
const chalk = require('chalk')  //颜色模块
const ora = require('ora') //动画加载模块
const download = require('download-git-repo') //从git下载模板
const tplObj = require(`${__dirname}/../template`)
const symbols = require('log-symbols');//终端图标
const inquirer = require('inquirer'); //用户输入选择交互模块
inquirer.registerPrompt('selectLine', require('inquirer-select-line'));
const child_process = require('child_process'); //调用子进程并执行终端命令
program
    .usage('<project-name>  or <template-name>')
program.parse(process.argv)
// 当没有输入参数的时候给个提示
if (program.args.length < 1) return program.help()
let templateName = program.args[0]
//有模板就用自定义的模板,没有就用默认的模板
let url = tplObj[templateName] ? tplObj[templateName] : tplObj['eve-admin']
//获取package.json
function getPackageJson (filePath) {
    const _packageJson = fs.readFileSync(filePath)
    return JSON.parse(_packageJson)
}
const param = [
    {
        type: 'input',
        name: 'description',
        message: '请输入项目描述'
    },
    {
        type: 'list',
        message: '使用sass还是less?',
        name: 'css',
        choices: ['sass', 'less'],
    }
]

tplObj[templateName] && param.unshift({
    type: 'input',
    name: 'name',
    message: '请输入项目名称'
})

inquirer.prompt(param).then((answers) => {
    let { name = templateName, description, css } = answers || {}
    console.log('line', css)

    if (fs.existsSync(name)) {
        console.log(chalk.red("项目已存在"))
        return
    }
    console.log(chalk.white('\n Start generating... \n'))
    // 出现加载图标
    const spinner = ora("Downloading...");
    spinner.start();
    // 执行下载方法并传入参数
    download(
        url,
        name,
        err => {
            if (err) {
                spinner.fail();
                console.log(chalk.red(`Generation failed. ${err}`))
                return
            }
            //需要修改的key值
            const meta = {
                description: description,
                name: name
            }
            const filePath = `${name}/package.json`;
            const packageJsonData = getPackageJson(filePath)
            Object.assign(packageJsonData, meta)
            const keyMap = {
                'less': () => {
                    packageJsonData.devDependencies.less = '^3.13.1'
                    packageJsonData.devDependencies["less-loader"] = '^5.0.0'
                },
                'sass': () => {
                    packageJsonData.devDependencies['node-sass'] = '^4.14.1'
                    packageJsonData.devDependencies["sass-loader"] = '^8.0.2'
                }
            }
            keyMap[css]()
            // 2代表格式化数据的时候前面填充2个空格
            fs.writeFileSync(filePath, JSON.stringify(packageJsonData, null, 2))
            // 结束加载图标
            spinner.succeed();
            console.log(symbols.success, chalk.green('项目初始化完毕'));
            console.log('\n To get started')
            console.log(`\n cd ${name}`)
            console.log(`\n npm i `)
            console.log(`\n npm run serve`)
            //TODO:可自动执行npm i,但无法显示进度,先排除当前功能
            // const cmd = 'npm  i';
            // child_process.exec(cmd, { cwd: path.join(process.cwd(), name) }, (error, stdout, stderr) => {
            //     console.log(`\n npm run serve`)
            //     if (error !== null) {
            //         console.log('exec error: ' + error);
            //     }
            //     console.log(stdout);
            // });
        }
    )
})