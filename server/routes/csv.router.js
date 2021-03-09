const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const {
    rejectUnauthenticated,
  } = require('../modules/authentication-middleware');


//needs auth 3/8
//will get total owed to coach AND aggregate all row ids in array.
//ON POST when data comes back, loop over ID array to update each row with date paid and invoice number
router.get('/', (req, res) => {
  const queryText = `
  SELECT ARRAY_AGG("user_id"), CONCAT("user".first_name, ' ', "user".last_name) AS "full_name", SUM("amount") as "total_owed", ARRAY_AGG("payments".id) AS "clients" FROM  "user"
  JOIN "client" ON "user".id = "client".user_id
  JOIN "payments" ON "client".contract_id = "payments".contract_id
  WHERE "payment_status" = 'complete' AND "is_paid" = 'False'
  GROUP BY "full_name";
  `
  pool.query(queryText).then((response)=>{
    console.log(response);
    res.send(response.rows);
  }).catch((error)=>{
    console.log('error getting payouts in csv.router')
    console.log(error);
    res.sendStatus(500);
  })

});


router.post('/', (req, res) => {
  const csv = req.body
  csv.shift()
  csv.pop()
  // console.log(csv)

  for (payment of csv) {
    console.log(payment)

      let payment_id = payment.id
      let product_id = payment.product
      let due_date = payment.date
      let scheduled_date = payment.date_scheduled
      let amount = Number(payment.amount)
      let payment_status = payment.payment_status
      let pending_date = payment.pending_date
      let complete_date = payment.complete_date
      let contract_id = payment.contract_id
      let payment_fee = Number(payment.fee)


      // const query = `DO
      //             $do$
      //             BEGIN
      //             IF EXISTS (SELECT * FROM payments WHERE payment_id = ${payment_id}) then
      //               UPDATE payments
      //               SET payment_id = ${payment_id}, product_id = ${product_id}, due_date = ${due_date}, scheduled_date = ${scheduled_date}, amount = ${amount}, payment_status = ${payment_status}, pending_date = ${pending_date}, complete_date = ${complete_date}, contract_id = ${contract_id}, payment_fee = ${payment_fee}
      //               WHERE payment_id = ${payment_id};
      //             ELSE
      //               INSERT INTO payments (payment_id, product_id, due_date, scheduled_date, amount, payment_status, pending_date, complete_date, contract_id, payment_fee)
      //               VALUES (${payment_id}, ${product_id}, ${due_date}, ${scheduled_date}, ${amount}, ${payment_status}, ${pending_date}, ${complete_date}, ${contract_id}, ${payment_fee});
      //             END IF;
      //             END
      //             $do$`

    // const query = `DO
    //               $do$
    //               BEGIN
    //               IF EXISTS (SELECT * FROM payments WHERE payment_id = $1) then
    //                 UPDATE payments
    //                 SET payment_id = $1, product_id = $2, due_date = $3, scheduled_date = $4, amount = $5, payment_status = $6, pending_date = $7, complete_date = $8, contract_id = $9, payment_fee = $10;
    //               ELSE
    //                 INSERT INTO payments (payment_id, product_id, due_date, scheduled_date, amount, payment_status, pending_date, complete_date, contract_id, payment_fee)
    //                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    //               END IF;
    //               END
    //               $do$`

    const query = `INSERT INTO payments (payment_id, product_id, due_date, scheduled_date, amount, payment_status, pending_date, complete_date, contract_id, payment_fee)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (payment_id)
                    DO
                      UPDATE SET product_id = $2, due_date = $3, scheduled_date = $4, amount = $5, payment_status = $6, pending_date = $7, complete_date = $8, contract_id = $9, payment_fee = $10`

    pool
    .query(query, [payment_id, product_id, due_date, scheduled_date, amount, payment_status, pending_date, complete_date, contract_id, payment_fee])
  }

});

module.exports = router;
