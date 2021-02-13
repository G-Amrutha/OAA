const router = require('express').Router();
const bcrypt = require('bcryptjs');
let User = require('../models/user.model');
const path = require('path');
const JWT = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
router.route("/").get(auth, (req, res) => {
    User.find()
      .then(user => res.json(user))
      .catch(err => res.status(400).json("Error: " + err));
  });

router.route('/email').get((req, res) => {
  const uwi_email = req.body.uwi_email;
    User.findOne({uwi_email})
    .then(user => {
      if(user) return res.status(400).json(
          {msg: 'User with same username already exist'}
      )
      return res.status(200).json(
        {msg: 'User does not exist'}
     );

}); 
});


router.route("/add").post((req, res) => {
  const uwi_email = req.body.uwi_email;
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const alt_email = req.body.alt_email;
  const dob = req.body.dob;
  const type = req.body.type;
  const sex = req.body.sex;
  const password = req.body.password;
  
  if (!uwi_email || !first_name || !last_name || !dob || !type || !sex || !password){
      return res.status(400).json({msg: ' Enter all Fields' });
  }
  User.findOne({uwi_email})
  .then(user => {
      if(user) return res.status(400).json(
          {msg: 'User with same username already exist'}
      );
      const newUser = new User({
        uwi_email,
        first_name,
        last_name,
        alt_email,
        dob,
        type,
        sex,
        password
       
      });
  bcrypt.genSalt(10,(err,salt) =>{
      bcrypt.hash(newUser.password, salt, (err, hash) => {
          
          newUser.password= hash;
  newUser
    .save()
    .then(user => {

      JWT.sign(
          {id:user.id
          },
          config.get('jwtSecret'),
          { expiresIn:3600},
          (err, token) =>{
              if(err) throw err;

              res.json({token,
              user:{
                  id: user.id,
                  uwi_email: user.uwi_email
              }
          })
          .catch(err => res.status(400).json("msg: " + err));
          }
      )

      });
      })
  })
});
});


router.route("/login").post((req, res) => {
  const uwi_email = req.body.uwi_email;
  const password = req.body.password;
  
  if (!uwi_email || !password){
      return res.status(400).json({msg: ' Enter all Fields' });
  }
  User.findOne({uwi_email})
  .then(user => {
      if(!user) return res.status(400).json(
          {msg: 'User does not exist'}
      );
      bcrypt.compare(password, user.password)
      .then(isMatch =>{
          if(!isMatch) return res.status(400).json({msg: ' Wrong PassWord' });
          JWT.sign(
              {id:user.id
              },
              config.get('jwtSecret'),
              { expiresIn:3600},
              (err, token) =>{
                  if(err) throw err;
                  res.json({token,
                      user:{
                          id: user.id,
                          uwi_email: user.uwi_email
                      }
                  })
                  .catch(err => res.status(400).json("Error: " + err));
              }
          )
      })
});
});

module.exports = router;