function* foo(from, step) {
  for (let i = 0; i < 6; i++) {
    yield from + step * i;
  }
}

y = foo(2, 2);

console.log(y.next());
console.log(y.next());

console.log('Hello');
