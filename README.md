# chaosvue

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

Here is the function that iterates the attractor. It has 4 parameters a, b, c, and d which are randomly set for each new attractor. The function continues iterating until 10% of the points have reached their maximum value (255). 
```
iteratePoint: function(x, y) {
  let nx = Math.sin(y * this.b) - (this.c * Math.sin(x * this.b));
  let ny = Math.sin(x * this.a) + this.d * Math.cos(y * this.a);
  return [nx, ny];
}
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

[![Netlify Status](https://api.netlify.com/api/v1/badges/778b585f-e7af-40fd-96e8-91b9fc15f480/deploy-status)](https://app.netlify.com/sites/chaosvue/deploys)
