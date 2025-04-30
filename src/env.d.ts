type Timestamp = number & { __timestampBrand: never }




declare interface DateConstructor {
  now(): Timestamp
}