FROM calbertts/node-gtk

MAINTAINER alaxallves@gmail.com

RUN apt-get update

#Installing required Gulp and Electron Libraries
RUN apt-get install -y libdbus-1-dev libgtk2.0-dev libnotify-dev libgnome-keyring-dev libgconf2-dev libasound2-dev libcap-dev libcups2-dev libxtst-dev libxss1 libnss3-dev libx11-xcb-dev

COPY . /igdm
WORKDIR /igdm

