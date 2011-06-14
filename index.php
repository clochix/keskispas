<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title>Keskispas</title>
    <link rel="stylesheet" href="keskispas.css" type="text/css" media="screen" />
    <script src="http://static.simile.mit.edu/timeline/api-2.3.1/timeline-api.js?bundle=false" type="text/javascript"></script>
  </head>
  <body>
    <div id="message">Loading</div>
    <div id="warning"></div>
    <div id="error"></div>
    <h1>¿?¿ KESKISPAS ?¿?</h1>
    <form id="where-form">
      <div>
        <label for="where">?¿? Ouksaspas ¿?¿</label>
        <input type="text" id="where" name="where" />
        <input type="button" id="where-button" value="¡ Go !"/>
        <label for="query">?¿? Koiksakoz ¿?¿</label>
        <input type="text" id="query" name="query" />
        <label for="query">?¿? Kenksaspas ¿?¿</label>
        <select id="when">
          <option value=""></option>
          <option value="3600">1 hour</option>
          <option value="7200">2 hours</option>
          <option value="14400">4 hours</option>
          <option value="43200">12 hours</option>
          <option value="86400">1 day</option>
          <option value="172800">2 days</option>
          <option value="604800">1 week</option>
          <option value="1209600">2 weeks</option>
          <option value="2419200">4 weeks</option>
        </select>
        <a id="help-button" href="#help"><span class="help-toggle">Heeeeeeeeelp !</span><span class="help-toggle" style="display: none">Ok !</span></a>
      </div>
      <div>
        <input type="button" id="flickr-button" value="Flickr"/>
        <input type="button" id="lastfm-button" value="LastFM"/>
        <input type="button" id="twitter-button" value="Twitter"/>
        <input type="button" id="buzz-button" value="Buzz"/>
        <input type="button" id="youtube-button" value="Youtube"/>
      </div>
    </form>
    <ul id="places" style="display: none">
    </ul>
    <div id="main" class="help-toggle">
      <div id="mapdiv"></div>
      <div id="timeline"></div>
      <ul id="res"></ul>
    </div>
    <div id="help-content">
      <h2 id="help">?¿? Komensamarch ¿?¿</h2>
      <p>Ce site est une expérimentation pour afficher des contenus géolocalisés provenant de plusieurs sources.</p>
      <p>Il vous faut d'abord sélectionner l'endroit: il essaie par défaut de déterminer la localisation de votre navigateur, mais vous pouvez également saisir un nom de lieu dans la boîte Ouksaspas puis choisir dans la liste déroulante, ou vous déplacer sur la carte</p>
      <p>Pour afficher des contenus, cliquez sur un des boutons:</p>
      <ul>
        <li>Flickr pour des photos de Flickr</li>
        <li>Twitter pour des gazouillis</li>
        <li>Youtube pour des vidéos</li>
        <li>LastFM pour voir les évènements annoncés sur le site</li>
      </ul>
      <p>Vous pouvez également affiner en saisissant un mot clé dans Koiksakoz et une date dans Kenksaspas (sans garantie, je ne l'ai pas branché partout et tous les services ne proposent pas ces fonctionnalités)</p>
      <p>Les résultats sont affichés dans la colonne de droite. S'ils sont datés, ils figureront également dans la timeline. Si une géolocalisation leur est associée, ils apparaitront également sur la carte</p>
      <p>C'est une expérimentation en cours, donc encore très bugguée. J'en suis navré, et n'ai guère le temps de corriger les problèmes en ce moment</p>
      <p>En attendant mieux, le code source est accessible via Ctrl-U ;)</p>
      <h2>Tips</h2>
      <ul id="tips">
        <li>You can zoom by pressing the Shift key and drawing a box whith the mouse</li>
        <li>Click on the map to see what's going on</li>
        <li>Click on a tweet to translate it into french</li>
        <li><a onclick="javascript:redrawEvents(events)">+</a></li>
      </ul>
      <h2>Licence</h2>
      <pre>
 Copyright (C) 2011  Clochix.net

 Keskispas is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 3 of the License, or
 (at your option) any later version.

 Keskispas is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 </pre>
      </div>
      <!-- OpenLayers -->
      <script src="http://openlayers.org/api/OpenLayers.js"></script>
      <!-- jQuery -->
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>
      <!-- Firebug Lite for debugging purpose
      <script type="text/javascript" src="https://getfirebug.com/firebug-lite.js"></script>
      -->
      <!-- Google Maps -->
      <script src="http://maps.google.com/maps?file=api&v=3&sensor=false&key=ABQIAAAAhFxrExSImr-G-Qbk6whKERR-1R8AnBs9iSFWA_St1SvVhTVFABRdwPsMVmB9r06IRaf61l6DqL6Rrw"></script>
      <script type="text/javascript">
        // Set up your keys to connect to services. Remember that they will be visible in the source code of the page
      var options = {
translateKey: '',
              geonames: '',
              lastFM: '',
              flickr: '',
              buzz: '',
              googlemap: ''
      };
      </script>
      <!-- Load the real keys  -->
      <script src='key.js'></script>
      <script src='keskispas.js'></script>
    </script>
  </body>
</html>

