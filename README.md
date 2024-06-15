<div align="center">
  <a href="https://github.com/programORdie2/SwagChat">
    <img src="images/logo.png" alt="Logo" width="200" height="80">
  </a>
</div>

<p align="center">
  <strong>
    A secure chat application for all your friends
  </strong>
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Platforms-Linux%20%7C%20macOS%20%7C%20Windows-blue.svg?style=flat"alt="Platforms">
    <a href="https://github.com/programordie2/swagchat/blob/master/LICENSE"><img src="https://img.shields.io/github/license/programordie2/swagchat.svg?style=flat" alt="license"></a>
</p>

<!-- TABLE OF CONTENTS -->
<!--
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>
-->


<!-- ABOUT THE PROJECT -->
## About The Project

![Product Name Screen Shot][product-screenshot]

SwagChat is a secure chat application designed to provide a seamless and safe communication experience for you and your friends. Whether you're discussing the latest trends or planning a group event, SwagChat ensures your conversations remain private and secure.

Key Features:
- **End-to-End Encryption:** All messages are encrypted to ensure complete privacy.
- **Cross-Platform Support:** Available on Linux, macOS, and Windows.
- **Customizable:** Add custom wallpapers and personalize your chat experience.
- **Authentication:** Secure login system to protect your data.
- **Real-time Messaging:** Instant messaging with real-time updates.



### Built With

* [![Node][Node.js]][Node-url]
* ![JavaScript][Javascript]
* [![Socket.io][Socket.io]][Socketio-url]
* [![Express.js][Express.io]][Express-url]



<!-- GETTING STARTED -->
## Getting Started

I can't run my server 24/7, so if you want to try out this cool app, you need to fork this repo and run it locally.<br />
To get a local copy up and running follow these simple steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation
1. Clone the repo
   ```sh
   git clone https://github.com/programORdie2/SwagChat.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Run the project
   ```sh
   npm ./backend/app.js
   ```



<!-- USAGE EXAMPLES -->
## Usage

This site works easy; just chat! You can add custom wallpapers in the right top of a server.

Make sure you don't forgot to change the JWT keys in the `.env` file!

That's it, I hope you enjoy it!


<!-- ROADMAP -->
## Roadmap

- [ ] Add basic Auth
    - [x] Make backend only send index.html when succesfully authenciated.
    - [x] Make sure not-authenciated users can't access the WebSocket.
    - [ ] Upload pfp on signup.

- [ ] New db (remove the basic JSON files I used for testing)
- [ ] Rooms db
- [ ] Clean up backend?

See the [open issues](https://github.com/programORdie2/SwagChat/issues) for a full list of proposed features (and known issues).


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the GPLv3 License. See `LICENSE` for more information.


<!-- CONTACT -->
## Contact

Contact me on discord - @programordie

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[product-screenshot]: images/screenshot.png

[Node.js]: https://img.shields.io/badge/node.js-35495E?style=for-the-badge&logo=nodedotjs&logoColor=4FC08D
[Node-url]: https://nodejs.org/

[JavaScript]: https://img.shields.io/badge/JavaScript-35495E?style=for-the-badge&logo=javascript&logoColor=F7DF1E

[Socket.io]: https://img.shields.io/badge/Socket.io-35495E?style=for-the-badge&logo=socketdotio&logoColor=4FC08D
[Socketio-url]: https://socket.io/

[Express.io]: https://img.shields.io/badge/Express.js-35495E?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/