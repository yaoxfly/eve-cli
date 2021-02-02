#!/usr/bin/env node
const fs = require('fs');
const program = require('commander')
const chalk = require('chalk')
const ora = require('ora')
const download = require('download-git-repo')
const tplObj = require(`${__dirname}/../template`)
const symbols = require('log-symbols');
const handlebars = require('handlebars')
const inquirer = require('inquirer');
program
    .usage('<project-name>  or <template-name>')
program.parse(process.argv)
// 当没有输入参数的时候给个提示
if (program.args.length < 1) return program.help()
let templateName = program.args[0]
//有模板就用自定义的模板,没有就用默认的模板
let url = tplObj[templateName] ? tplObj[templateName] : tplObj['eve-admin']

const param = [
    {
        type: 'input',
        name: 'description',
        message: '请输入项目描述'
    }
]
tplObj[templateName] && param.unshift({
    type: 'input',
    name: 'name',
    message: '请输入项目名称'
})

inquirer.prompt(param).then((answers) => {
    let { name = templateName, description } = answers || {}
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
            const meta = {
                description: description,
                name: name
            }
            const fileName = `${name}/package.json`;
            const content = fs.readFileSync(fileName).toString();
            const result = handlebars.compile(content)(meta);
            fs.writeFileSync(fileName, result);
            // 结束加载图标
            spinner.succeed();
            console.log(symbols.success, chalk.green('项目初始化完成'));
            console.log('\n To get started')
            console.log(`\n cd ${name}`)
            console.log(`\n npm run serve \n`)
        }
    )
})

