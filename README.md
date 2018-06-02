# IG:dm Messenger
Multi-platform Desktop application for INSTAGRAM DMs, built with electron

### View Website 
[here](http://ifedapoolarewaju.github.io/igdm/)


### Preview

![Start a chat](docs/img/startchat.gif)

![Quote a message](docs/img/quotemessage.gif)

![View unfollowers](docs/img/unfollowers.gif)

### Local Development

To setup this project locally for development purposes please follow the following steps:

1. Ensure you Node.js installed. [See](https://nodejs.org/en/download/)

2. Clone this repo by running the command - `git clone https://github.com/ifedapoolarewaju/igdm.git`

3. Navigate to the directory where the repo is cloned to. (e.g `cd igdm`)

4. Run `npm install` to install all the dependencies.

5. Start the application locally by running `npm start`

### Wrapped Local Development with Docker+Nut

To setup this project locally using Docker and Nut tools for development purposes, please follow the following steps:

1. Ensure you have Docker CE installed [See](https://docs.docker.com/install/)

2. Clone this repo by running the command - `git clone https://github.com/ifedapoolarewaju/igdm.git`

3. Navigate to the directory where the repo is cloned to. (e.g `cd igdm`)

4. Download Nut by running `curl -L https://github.com/matthieudelaro/nut/raw/manualbuild/release/linux/nut -o nut && chmod a+x nut`

4. Run `sudo mv nut /usr/local/bin/nut` to move the nut executable to your local binaries *optional step* 
   If you choose not to execute this step, use the nut commands just by simply adding a `./` before `nut`

5. Start the wrapped application by running `nut run`

6. See your changes by running `nut reload`

If you haven't done the Docker [post-installation step](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user) just add `sudo` to the nut commands

That's it! :) Now you can have those pull requests rolling in! :D

## License

[The MIT License](LICENSE).
