/* eslint-disable no-empty */
class Promise {
  constructor(resolver) {
    if (typeof resolver !== "function") {
      throw new TypeError("Promise resolver " + resolver + " is not a function")
    }
    if (!(this instanceof Promise)) return new Promise(resolver)

    var self = this
    this.status = "pending"
    // pending 收集的回调，内部只会有一个
    this.callbacks = []
    this.data = undefined
    this.reason = undefined
    this.resolve = function(value) {
      if (self.status !== "pending") {
        return
      }
      self.status = "resolved"
      self.data = value

      setTimeout(function() {
        self.callbacks.forEach(function(f) {
          f.onResolved(value)
        })
      })
    }
    this.reject = function(reason) {
      if (self.status !== "pending") {
        return
      }
      self.status = "rejected"
      self.reason = reason

      setTimeout(function() {
        self.callbacks.forEach(function(f) {
          f.onRejected(reason)
        })
      })
    }
    try {
      resolver(this.resolve, this.reject)
    } catch (e) {
      this.reject(e)
    }
  }

  then(onResolved, onRejected) {
    var self = this
    onResolved =
      typeof onResolved === "function"
        ? onResolved
        : function(v) {
            return v
          }
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : function(r) {
            throw r
          }
    var promise2 = new Promise(function() {})
    if (self.status !== "pending") {
      // 确定状态的 promise 遇到 then
      var f = self.status === "resolved" ? onResolved : onRejected
      var v = self.status === "resolved" ? self.data : self.reason
      setTimeout(function() {
        try {
          var x = f(v)
          self.confirmPromise(promise2, x)
        } catch (e) {
          promise2.reject(e)
        }
      })
    } else {
      // 还没确定状态的 promise 遇到 then
      self.callbacks.push({
        onResolved: function(value) {
          try {
            var x = onResolved(value)
            self.confirmPromise(promise2, x)
          } catch (e) {
            promise2.reject(e)
          }
        },
        onRejected: function(reason) {
          try {
            var x = onRejected(reason)
            self.confirmPromise(promise2, x)
          } catch (e) {
            promise2.reject(e)
          }
        }
      })
    }
    return promise2
  }

  /**
   * 接收上一个 promise 的 callbacks 返回值，对异常情况进行处理
   */
  confirmPromise(promise, x) {
    var self = this
    var then
    var flag = false
    if (promise === x) {
      return promise.reject(
        new TypeError("Chaining cycle detected for promise!")
      )
    }

    if (x !== null && (typeof x === "object" || typeof x === "function")) {
      try {
        then = x.then
        if (typeof then === "function") {
          then.call(
            x,
            function(y) {
              if (flag) return
              flag = true
              self.confirmPromise(promise, y)
            },
            function(r) {
              if (flag) return
              flag = true
              promise.reject(r)
            }
          )
        } else {
          promise.resolve(x)
        }
      } catch (e) {
        if (flag) return
        flag = true
        promise.reject(e)
      }
    } else {
      promise.resolve(x)
    }
  }

  valueOf() {
    return this.data
  }
  catch(onRejected) {
    return this.then(null, onRejected)
  }

  static deferred() {
    var dfd = {}
    dfd.promise = new Promise(function(resolve, reject) {
      dfd.resolve = resolve
      dfd.reject = reject
    })
    return dfd
  }
  static defer() {
    var dfd = {}
    dfd.promise = new Promise(function(resolve, reject) {
      dfd.resolve = resolve
      dfd.reject = reject
    })
    return dfd
  }
}
try {
  module.exports = Promise
} catch (error) {
}
