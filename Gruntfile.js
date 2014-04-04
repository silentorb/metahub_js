module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-ts')
  grunt.loadNpmTasks('grunt-text-replace')

  grunt.initConfig({
    ts: {
      metahub: {
        src: ["metahub.ts"],        // The source typescript files, http://gruntjs.com/configuring-tasks#files
        out: 'metahub.js',                // If specified, generate an out.js file which is the merged js file
        options: {
          target: 'es5',
          module: 'commonjs',
          declaration: true,       // true | false  (default)
          verbose: true
        }
      }
    },
    replace: {
      "ambient module declaration": {
        src: ["metahub.d.ts"],
        overwrite: true,
        replacements: [
          {
            from: 'export = MetaHub;',
            to: 'declare module "metahub" { export = MetaHub }'
          }
        ]
      }
    },
    watch: {
       vineyard: {
        files: 'lib/**/*.ts',
        tasks: ['default']
      }
    }
  })

  grunt.registerTask('default', ['ts', 'replace']);

}