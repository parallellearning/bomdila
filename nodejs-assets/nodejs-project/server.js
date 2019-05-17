module.exports = function setupServer(callback) {
  // find ip addresses
  var os = require('os');
  var interfaces = os.networkInterfaces();
  var addresses = [];
  for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
      var address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }

  // setup local database
  var external = process.env.EXTERNAL_STORAGE || './';
  var path = require('path');
  var Datastore = require('nedb');
  var db = new Datastore({
    filename: path.join(external, 'app.db'),
    autoload: true
  });

  var {
    format,
    setMinutes,
    setHours,
    setSeconds,
    parse,
    isBefore,
    isAfter,
    isEqual
  } = require('./date-fns');

  var ID = function() {
    return (
      '_' +
      Math.random()
        .toString(36)
        .substr(2, 9)
    );
  };

  const express = require('express');
  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Our first route
  app.get('/get-ips', function(req, res) {
    res.json({ addresses });
  });

  app.get('/schedule/:day', (req, res) => {
    db.findOne({ day: req.params.day }, async function(err, docs) {
      if (err) {
        res.status(400).json({ err });
      }
      if (!docs) {
        const newdate = parse(req.params.day, 'YYYY-MM-DD');
        db.insert(
          {
            day: req.params.day,
            slots: [
              {
                id: ID(),
                startTime: setHours(setMinutes(setSeconds(newdate, 00), 00), 8),
                endTime: setHours(setMinutes(setSeconds(newdate, 59), 59), 8),
                target: 20,
                scans: [],
                lossTime: '',
                lossReason: ''
              }
            ]
          },
          function(err, newDoc) {
            if (err) {
              throw new Error();
            }
            res.json({ data: newDoc });
          }
        );
      } else {
        res.json({ data: docs });
      }
    });
  });

  app.post('/schedule/slots/:day', (req, res) => {
    db.update(
      { day: req.params.day },
      {
        $set: {
          slots: req.body.slots
        }
      },
      function(err) {
        if (err) {
          throw new Error();
        }
        res.json({ message: 'Success' });
      }
    );
  });

  app.post('/schedule/scans/:day', (req, res) => {
    db.findOne({ day: req.params.day }, function(err, doc) {
      const { slotId, scandata } = req.body;
      db.update(
        { day: req.params.day },
        {
          $set: {
            slots: doc.slots.map(slot => {
              if (slot.id === slotId) {
                return {
                  ...slot,
                  scans: [...slot.scans, scandata]
                };
              }
              return slot;
            })
          }
        },
        { upsert: true },
        function(err) {
          if (err) {
            console.log(err);
            throw new Error();
          }
          res.json('Done');
        }
      );
    });
  });

  // Listen to port 3000
  app.listen(3000, callback);
};
