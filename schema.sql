PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE roles (
  id_rol    INTEGER PRIMARY KEY AUTOINCREMENT,
  rol       TEXT NOT NULL
);
CREATE TABLE subscription (
  id_subscription  INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  state            TEXT NOT NULL,
  amount           REAL NOT NULL,
  plan_benefits    TEXT
);
CREATE TABLE schedule (
  id_schedule  INTEGER PRIMARY KEY AUTOINCREMENT,
  week         TEXT NOT NULL,
  weekend      TEXT NOT NULL,
  sunday       TEXT NOT NULL
);
CREATE TABLE category (
  id_category  INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL
);
CREATE TABLE coupon_state (
  id_coupon_state  INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL
);
CREATE TABLE name_social_media (
  id_name_social_media  INTEGER PRIMARY KEY AUTOINCREMENT,
  social_media          TEXT NOT NULL
);
CREATE TABLE type_service (
  id_type_service  INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL
);
CREATE TABLE notifications (
  id_notification  INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  expiration_date  TEXT NOT NULL
);
CREATE TABLE user_data (
  id_user_data   INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  tel            TEXT NOT NULL,
  email          TEXT NOT NULL,
  gps_last       TEXT DEFAULT NULL,
  address        TEXT NOT NULL,
  password_hash  TEXT DEFAULT NULL,
  UNIQUE (email)
);
CREATE TABLE store_sub (
  id_store_sub      INTEGER PRIMARY KEY AUTOINCREMENT,
  state_payout      TEXT NOT NULL,
  expiration_date   TEXT NOT NULL,
  upgrade_date      TEXT NOT NULL,
  fk_subscription_id INTEGER NOT NULL,
  FOREIGN KEY (fk_subscription_id) REFERENCES subscription(id_subscription) ON UPDATE CASCADE
);
CREATE TABLE users (
  id_user       INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL,
  date_reg      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  state         INTEGER NOT NULL DEFAULT 1,
  fk_user_data  INTEGER NOT NULL,
  fk_rol        INTEGER NOT NULL,
  UNIQUE (username),
  FOREIGN KEY (fk_user_data) REFERENCES user_data(id_user_data) ON UPDATE CASCADE,
  FOREIGN KEY (fk_rol)       REFERENCES roles(id_rol)           ON UPDATE CASCADE
);
CREATE TABLE customer (
  id_customer  INTEGER PRIMARY KEY AUTOINCREMENT,
  points       INTEGER NOT NULL DEFAULT 0,
  fk_user      INTEGER NOT NULL,
  FOREIGN KEY (fk_user) REFERENCES users(id_user) ON UPDATE CASCADE
);
CREATE TABLE professionals (
  id_professional  INTEGER PRIMARY KEY AUTOINCREMENT,
  description      TEXT NOT NULL,
  address          TEXT NOT NULL,
  accept_point     INTEGER NOT NULL DEFAULT 0,
  location         TEXT NOT NULL,
  stars            REAL NOT NULL DEFAULT 0.00,
  fk_schedule      INTEGER NOT NULL,
  fk_type_service  INTEGER NOT NULL,
  fk_user_id       INTEGER NOT NULL,
  fk_store_sub_id  INTEGER NOT NULL,
  FOREIGN KEY (fk_schedule)     REFERENCES schedule(id_schedule)         ON UPDATE CASCADE,
  FOREIGN KEY (fk_type_service) REFERENCES type_service(id_type_service) ON UPDATE CASCADE,
  FOREIGN KEY (fk_user_id)      REFERENCES users(id_user)                ON UPDATE CASCADE,
  FOREIGN KEY (fk_store_sub_id) REFERENCES store_sub(id_store_sub)       ON UPDATE CASCADE
);
CREATE TABLE stores (
  id_store        INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  address         TEXT NOT NULL,
  location        TEXT NOT NULL,
  stars           REAL NOT NULL DEFAULT 0.00,
  fk_user         INTEGER NOT NULL,
  fk_category     INTEGER NOT NULL,
  fk_schedule     INTEGER NOT NULL,
  fk_store_sub_id INTEGER NOT NULL,
  FOREIGN KEY (fk_user)         REFERENCES users(id_user)           ON UPDATE CASCADE,
  FOREIGN KEY (fk_category)     REFERENCES category(id_category)    ON UPDATE CASCADE,
  FOREIGN KEY (fk_schedule)     REFERENCES schedule(id_schedule)    ON UPDATE CASCADE,
  FOREIGN KEY (fk_store_sub_id) REFERENCES store_sub(id_store_sub)  ON UPDATE CASCADE
);
CREATE TABLE benefit_prof (
  id_benefit_prof  INTEGER PRIMARY KEY AUTOINCREMENT,
  description      TEXT NOT NULL,
  percentage       REAL NOT NULL,
  fk_professional  INTEGER NOT NULL,
  FOREIGN KEY (fk_professional) REFERENCES professionals(id_professional) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE benefit_store (
  id_benefit_store  INTEGER PRIMARY KEY AUTOINCREMENT,
  description       TEXT NOT NULL,
  req_point         INTEGER NOT NULL,
  percentage        REAL NOT NULL,
  fk_store          INTEGER NOT NULL,
  FOREIGN KEY (fk_store) REFERENCES stores(id_store) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE comments_prof (
  id_comment          INTEGER PRIMARY KEY AUTOINCREMENT,
  body                TEXT NOT NULL,
  stars               INTEGER NOT NULL DEFAULT 4,
  date                TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fk_customer_id      INTEGER NOT NULL,
  fk_professional_id  INTEGER NOT NULL,
  FOREIGN KEY (fk_customer_id)     REFERENCES customer(id_customer)         ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (fk_professional_id) REFERENCES professionals(id_professional) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE comments_store (
  id_comment     INTEGER PRIMARY KEY AUTOINCREMENT,
  body           TEXT NOT NULL,
  stars          INTEGER NOT NULL DEFAULT 4,
  date           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fk_customer_id INTEGER NOT NULL,
  fk_store_id    INTEGER NOT NULL,
  FOREIGN KEY (fk_customer_id) REFERENCES customer(id_customer) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (fk_store_id)    REFERENCES stores(id_store)       ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE coupon_prof (
  id_coupon          INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT NOT NULL,
  description        TEXT NOT NULL,
  expiration_date    TEXT NOT NULL,
  point_req          INTEGER NOT NULL,
  code_coupon        TEXT NOT NULL,
  amount             REAL NOT NULL,
  fk_professional_id INTEGER NOT NULL,
  fk_coupon_state    INTEGER NOT NULL,
  UNIQUE (code_coupon),
  FOREIGN KEY (fk_professional_id) REFERENCES professionals(id_professional) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (fk_coupon_state)    REFERENCES coupon_state(id_coupon_state)  ON UPDATE CASCADE
);
CREATE TABLE coupon_store (
  id_coupon        INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  state            INTEGER NOT NULL DEFAULT 1,
  expiration_date  TEXT NOT NULL,
  point_req        INTEGER NOT NULL,
  code_coupon      TEXT NOT NULL,
  amount           REAL NOT NULL,
  fk_store         INTEGER NOT NULL,
  fk_coupon_state  INTEGER NOT NULL,
  UNIQUE (code_coupon),
  FOREIGN KEY (fk_store)        REFERENCES stores(id_store)                ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (fk_coupon_state) REFERENCES coupon_state(id_coupon_state)   ON UPDATE CASCADE
);
CREATE TABLE coupon_buy_prof (
  id_coupon_buy      INTEGER PRIMARY KEY AUTOINCREMENT,
  fk_coupon_prof_id  INTEGER NOT NULL,
  fk_customer_id     INTEGER NOT NULL,
  FOREIGN KEY (fk_coupon_prof_id) REFERENCES coupon_prof(id_coupon)    ON UPDATE CASCADE,
  FOREIGN KEY (fk_customer_id)    REFERENCES customer(id_customer)     ON UPDATE CASCADE
);
CREATE TABLE coupon_buy_store (
  id_coupon_buy   INTEGER PRIMARY KEY AUTOINCREMENT,
  fk_customer_id  INTEGER NOT NULL,
  fk_coupon_id    INTEGER NOT NULL,
  FOREIGN KEY (fk_customer_id) REFERENCES customer(id_customer)    ON UPDATE CASCADE,
  FOREIGN KEY (fk_coupon_id)   REFERENCES coupon_store(id_coupon)  ON UPDATE CASCADE
);
CREATE TABLE prof_purchase (
  id_prof_purchase  INTEGER PRIMARY KEY AUTOINCREMENT,
  date              TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount            REAL NOT NULL,
  points_earn       INTEGER NOT NULL DEFAULT 0,
  fk_professional   INTEGER NOT NULL,
  fk_customer       INTEGER NOT NULL,
  FOREIGN KEY (fk_professional) REFERENCES professionals(id_professional) ON UPDATE CASCADE,
  FOREIGN KEY (fk_customer)     REFERENCES customer(id_customer)          ON UPDATE CASCADE
);
CREATE TABLE store_purchase (
  id_store_purchase  INTEGER PRIMARY KEY AUTOINCREMENT,
  date               TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount             REAL NOT NULL,
  points_earn        INTEGER NOT NULL DEFAULT 0,
  fk_customer        INTEGER NOT NULL,
  fk_store           INTEGER NOT NULL,
  FOREIGN KEY (fk_customer) REFERENCES customer(id_customer) ON UPDATE CASCADE,
  FOREIGN KEY (fk_store)    REFERENCES stores(id_store)      ON UPDATE CASCADE
);
CREATE TABLE sub_payout (
  id_sub_payout  INTEGER PRIMARY KEY AUTOINCREMENT,
  date           TEXT NOT NULL,
  amount         REAL NOT NULL,
  description    TEXT DEFAULT NULL,
  fk_store_sub   INTEGER NOT NULL,
  fk_user        INTEGER NOT NULL,
  FOREIGN KEY (fk_store_sub) REFERENCES store_sub(id_store_sub) ON UPDATE CASCADE,
  FOREIGN KEY (fk_user)      REFERENCES users(id_user)           ON UPDATE CASCADE
);
CREATE TABLE social_media (
  id_social_media       INTEGER PRIMARY KEY AUTOINCREMENT,
  link                  TEXT DEFAULT NULL,
  fk_name_social_media  INTEGER NOT NULL,
  fk_user_data          INTEGER NOT NULL,
  FOREIGN KEY (fk_name_social_media) REFERENCES name_social_media(id_name_social_media) ON UPDATE CASCADE,
  FOREIGN KEY (fk_user_data)         REFERENCES user_data(id_user_data) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE notif_users (
  id_notif_users       INTEGER PRIMARY KEY AUTOINCREMENT,
  fk_notifications_id  INTEGER NOT NULL,
  fk_users_id          INTEGER NOT NULL,
  state                INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (fk_notifications_id) REFERENCES notifications(id_notification) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (fk_users_id)         REFERENCES users(id_user)                 ON DELETE CASCADE ON UPDATE CASCADE
);
DELETE FROM sqlite_sequence;
CREATE INDEX idx_benefit_prof_professional     ON benefit_prof(fk_professional);
CREATE INDEX idx_benefit_store_store           ON benefit_store(fk_store);
CREATE INDEX idx_comments_prof_customer        ON comments_prof(fk_customer_id);
CREATE INDEX idx_comments_prof_professional    ON comments_prof(fk_professional_id);
CREATE INDEX idx_comments_store_customer       ON comments_store(fk_customer_id);
CREATE INDEX idx_comments_store_store          ON comments_store(fk_store_id);
CREATE INDEX idx_coupon_buy_prof_coupon        ON coupon_buy_prof(fk_coupon_prof_id);
CREATE INDEX idx_coupon_buy_prof_customer      ON coupon_buy_prof(fk_customer_id);
CREATE INDEX idx_coupon_buy_store_customer     ON coupon_buy_store(fk_customer_id);
CREATE INDEX idx_coupon_buy_store_coupon       ON coupon_buy_store(fk_coupon_id);
CREATE INDEX idx_coupon_prof_professional      ON coupon_prof(fk_professional_id);
CREATE INDEX idx_coupon_prof_state             ON coupon_prof(fk_coupon_state);
CREATE INDEX idx_coupon_store_store            ON coupon_store(fk_store);
CREATE INDEX idx_coupon_store_state            ON coupon_store(fk_coupon_state);
CREATE INDEX idx_customer_user                 ON customer(fk_user);
CREATE INDEX idx_notif_users_notification      ON notif_users(fk_notifications_id);
CREATE INDEX idx_notif_users_user              ON notif_users(fk_users_id);
CREATE INDEX idx_professionals_schedule        ON professionals(fk_schedule);
CREATE INDEX idx_professionals_type_service    ON professionals(fk_type_service);
CREATE INDEX idx_professionals_user            ON professionals(fk_user_id);
CREATE INDEX idx_professionals_store_sub       ON professionals(fk_store_sub_id);
CREATE INDEX idx_prof_purchase_professional    ON prof_purchase(fk_professional);
CREATE INDEX idx_prof_purchase_customer        ON prof_purchase(fk_customer);
CREATE INDEX idx_social_media_name             ON social_media(fk_name_social_media);
CREATE INDEX idx_social_media_user_data        ON social_media(fk_user_data);
CREATE INDEX idx_stores_user                   ON stores(fk_user);
CREATE INDEX idx_stores_category               ON stores(fk_category);
CREATE INDEX idx_stores_schedule               ON stores(fk_schedule);
CREATE INDEX idx_stores_store_sub              ON stores(fk_store_sub_id);
CREATE INDEX idx_store_purchase_customer       ON store_purchase(fk_customer);
CREATE INDEX idx_store_purchase_store          ON store_purchase(fk_store);
CREATE INDEX idx_store_sub_subscription        ON store_sub(fk_subscription_id);
CREATE INDEX idx_sub_payout_store_sub          ON sub_payout(fk_store_sub);
CREATE INDEX idx_sub_payout_user               ON sub_payout(fk_user);
CREATE INDEX idx_users_user_data               ON users(fk_user_data);
CREATE INDEX idx_users_rol                     ON users(fk_rol);
