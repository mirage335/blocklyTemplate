#!/bin/bash
ubiquitous_bash.sh

echo -e '\E[1;32;46m Refreshing assets. \E[0m'

cd "$(getScriptAbsoluteFolder)"

./build.py

echo -e '\E[1;32;46m Default build script complete. \E[0m'

cd apps

java -jar _soy/SoyMsgExtractor.jar --outputFile extracted_msgs.xlf --srcs common.soy,code/template.soy,graph/template.soy,maze/template.soy,plane/template.soy,puzzle/template.soy,turtle/template.soy,template.soy

../i18n/xliff_to_json.py --xlf extracted_msgs.xlf --templates common.soy {code,graph,maze,plane,puzzle,turtle}/template.soy template.soy

for i in code graph index maze plane puzzle turtle; do ../i18n/json_to_js.py --output_dir=$i/generated --template common.soy,$i/template.soy json/*.json; done

echo -e '\E[1;32;46m Directory "apps" *.soy rebuild complete. \E[0m'

cd code

java -jar ../_soy/SoyToJsSrcCompiler.jar --outputPathFormat generated/en.js --srcs ../common.soy,template.soy

echo -e '\E[1;32;46m Directory "apps/code" *.soy rebuild complete. \E[0m'

echo ''

echo -e '\E[1;32;46m Rebuild complete. \E[0m'