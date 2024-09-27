#! /bin/bash
#  (MIT/GPL3+) Alberto Salvia Novella (es20490446e.wordpress.com)


mainFunction () {
	installIcon
	installMenuEntry
}


changeToThisProgramDir () {
	cd "$( dirname "${BASH_SOURCE[0]}" )"
}


checkPermissions () {
	user=$(id -u)

	if [ "${user}" -ne 0 ]; then
		sudo "${BASH_SOURCE[0]}"
        exit ${?}
    fi
}


execute () {
	function="${1}"
	command="${2}"
    error=$(eval "${command}" 2>&1 >"/dev/null")

    if [ ${?} -ne 0 ]; then
        echo "${function}: ${error}"
        exit 1
    fi
}


installIcon () {
	logo="Instagram_logo_2016.svg"
	version="20160929161413"
	execute "installIcon" "wget \"https://upload.wikimedia.org/wikipedia/commons/archive/e/e7/${version}%21${logo}\""
	execute "installIcon" "mv \"${version}!${logo}\" \"/usr/share/pixmaps/igdm.svg\""
}


installMenuEntry () {
	entry="igdm.desktop"
	execute "installMenuEntry" "cp ${entry} /usr/share/applications/${entry}"
}


setEnvironment () {
	changeToThisProgramDir
	checkPermissions
}


setEnvironment
mainFunction
