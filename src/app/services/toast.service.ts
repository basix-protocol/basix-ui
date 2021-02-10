import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ToastService {
  toast: Toast[] = [];

  constructor() {}

  showToast(title, content): void {
    this.toast.push(new Toast(title, content));
  }

  hideToast(position): void {
    this.toast[position].hide();
  }
}

class Toast {
  title: string;
  content: string;
  moment: Date;
  visible = false;
  interval;

  constructor(title, content) {
    this.show(title, content);
  }

  show(title, content): void {
    this.title = title;
    this.content = content;
    this.moment = new Date();
    this.visible = true;

    this.interval = setInterval(() => {
      const previousMoment = this.moment;
      this.moment = new Date();
      this.moment = previousMoment;
    }, 1000);
  }

  hide(): void {
    this.visible = false;
    clearInterval(this.interval);
  }
}
